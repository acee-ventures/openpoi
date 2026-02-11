import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleOpenAiHttpRequest } from "./openai-http.js";

// ─── Mocks ───────────────────────────────────────────────────────────────────

// Mock dependencies to isolate the integration logic
vi.mock("../payment-hub/poi-auth.js", () => ({
  hasPoiApiKey: vi.fn(() => true),
  authenticateRequest: vi.fn(() =>
    Promise.resolve({
      ok: true,
      userId: "user_123",
      role: "user",
      rateLimits: { rpm: 100, tpm: 100000 },
      allowedModels: null,
    }),
  ),
  toAuthenticatedUser: vi.fn((result) => ({
    userId: result.userId,
    role: result.role,
    rateLimits: result.rateLimits,
    allowedModels: result.allowedModels,
  })),
}));

vi.mock("../payment-hub/credits-engine.js", () => ({
  getBalance: vi.fn(() => Promise.resolve({ poiCredits: 100 })),
  getUserDiscountRate: vi.fn(() => Promise.resolve(0.1)),
  recordUsageAndDeduct: vi.fn(() => Promise.resolve({ success: true, creditsCost: 5 })),
  // We mock other exports just in case, though they shouldn't be called directly by gateway
  deductCredits: vi.fn(),
  addCredits: vi.fn(),
}));

vi.mock("../commands/agent.js", () => ({
  agentCommand: vi.fn(() =>
    Promise.resolve({
      meta: {
        agentMeta: {
          usage: {
            input: 50,
            output: 50,
            total: 100,
          },
        },
      },
      payloads: [{ text: "Hello world" }],
    }),
  ),
}));

// Mock http-common to avoid stream reading complexity
vi.mock("./http-common.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    readJsonBodyOrError: vi.fn(() =>
      Promise.resolve({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hello" }],
      }),
    ),
    sendJson: vi.fn(),
    sendUnauthorized: vi.fn(),
    sendMethodNotAllowed: vi.fn(),
  };
});

// Import mocked modules for assertions
import * as creditsEngine from "../payment-hub/credits-engine.js";
import * as httpCommon from "./http-common.js";

describe("OpenAI HTTP Payment Integration", () => {
  let req: IncomingMessage;
  let res: ServerResponse;

  beforeEach(() => {
    vi.clearAllMocks();
    // Enable Payment Hub feature flag
    process.env.PAYMENT_HUB_ENABLED = "true";

    // Setup request/response mocks
    req = new IncomingMessage(new Socket());
    req.url = "/v1/chat/completions";
    req.method = "POST";
    req.headers = {
      host: "localhost:3000",
      authorization: "Bearer poi_sk_test_key",
    };

    res = new ServerResponse(req);
    // Mock res methods that might be used
    res.end = vi.fn() as any;
    res.write = vi.fn() as any;
    res.setHeader = vi.fn();
  });

  afterEach(() => {
    delete process.env.PAYMENT_HUB_ENABLED;
  });

  it("should enforce payment checks and record usage when Payment Hub is enabled", async () => {
    const opts = {
      auth: { allowed: true } as any,
    };

    await handleOpenAiHttpRequest(req, res, opts);

    // 1. Verify credit balance was checked (via getBalance called by checkCreditsGate)
    expect(creditsEngine.getBalance).toHaveBeenCalledWith("user_123");

    // 2. Verify agent command was executed (implied by success response)
    // We can verify sendJson was called with success
    expect(httpCommon.sendJson).toHaveBeenCalledWith(
      expect.anything(),
      200,
      expect.objectContaining({
        choices: expect.arrayContaining([
          expect.objectContaining({ message: expect.objectContaining({ content: "Hello world" }) }),
        ]),
      }),
    );

    // 3. Verify usage was settled (postResponseBillingHook -> settleUsage -> recordUsageAndDeduct)
    expect(creditsEngine.recordUsageAndDeduct).toHaveBeenCalledTimes(1);
    expect(creditsEngine.recordUsageAndDeduct).toHaveBeenCalledWith(
      "user_123",
      expect.objectContaining({
        model: "gpt-4",
        tokensIn: 50,
        tokensOut: 50,
      }),
      0.1, // Discount rate from mock
    );
  });

  it("should block request if insufficient credits", async () => {
    // Override getBalance to return 0 credits
    vi.mocked(creditsEngine.getBalance).mockResolvedValueOnce({ poiCredits: 0 });

    const opts = { auth: { allowed: true } as any };
    await handleOpenAiHttpRequest(req, res, opts);

    // Should not call agent logic
    const { agentCommand } = await import("../commands/agent.js");
    expect(agentCommand).not.toHaveBeenCalled();

    // Should return 402/401
    // preRequestBillingHook sends response directly via res.end or internal helper
    // In our mock, gate.allowed would be false.
    // We need to verify response was sent indicating error.
    // The real code calls sendBillingJson which uses res.end.
    // Since we didn't mock sendBillingJson (it's internal to gateway-billing.ts),
    // we should check res.statusCode or specific error body if captured.

    // However, sendBillingJson is not exported/mocked. It writes to res.
    expect(res.statusCode).toBe(402);
  });
});
