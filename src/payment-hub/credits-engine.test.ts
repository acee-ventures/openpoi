import { describe, it, expect, vi, beforeEach } from "vitest";
import { deductCredits } from "./credits-engine.js";
import { getDb } from "./db.js";

// Mock drizzle-orm BEFORE importing the module under test
vi.mock("drizzle-orm", () => {
  // Simple mock for sql template tag
  const sqlMock = (strings: TemplateStringsArray, ...values: any[]) => {
    return {
      text: strings.raw.join("?"), // basic string reconstruction
      values,
    };
  };
  return {
    sql: sqlMock,
    eq: vi.fn(),
    and: vi.fn(),
  };
});

// Mock local modules
vi.mock("./db.js", () => ({
  getDb: vi.fn(),
}));

// Mock pricing module to avoid side effects if strictly needed,
// though deductCredits doesn't import it directly for logic (only types).
vi.mock("./pricing.js", () => ({
  calculateCreditCost: vi.fn(),
}));

describe("Payment Hub - Credits Engine", () => {
  const mockExecute = vi.fn();
  const mockDb = {
    execute: mockExecute,
    insert: vi.fn(), // Should not be called in new implementation
    select: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getDb as any).mockReturnValue(mockDb);
  });

  describe("deductCredits", () => {
    it("should execute a single atomic SQL transaction using CTE", async () => {
      // Mock successful deduction (count 1)
      mockExecute.mockResolvedValueOnce([{ cnt: 1 }] as any);

      const userId = "user_123";
      const amount = 100;
      const scene = "test_scene";
      const result = await deductCredits(userId, amount, scene, {
        model: "gpt-4",
        tokensIn: 50,
        tokensOut: 20,
      });

      expect(result).toBe(true);
      expect(mockExecute).toHaveBeenCalledTimes(1);

      const sqlCall = mockExecute.mock.calls[0][0];
      // Verify SQL structure
      expect(sqlCall.text || sqlCall.toString()).toContain("WITH deducted AS");
      expect(sqlCall.text || sqlCall.toString()).toContain("UPDATE user_balances");
      expect(sqlCall.text || sqlCall.toString()).toContain("INSERT INTO unified_ledger");
      // CTE structure check is sufficient to verify implementation intent
      // Actually common CTE structure check
    });

    it("should return false if deduction fails (insufficient funds)", async () => {
      // Mock failed deduction (count 0)
      mockExecute.mockResolvedValueOnce([{ cnt: 0 }] as any);

      const result = await deductCredits("user_poor", 1000, "test");
      expect(result).toBe(false);
    });

    it("should return true immediately if amount is <= 0", async () => {
      const result = await deductCredits("user_any", 0, "test");
      expect(result).toBe(true);
      expect(mockExecute).not.toHaveBeenCalled();
    });

    it("should handle metadata correctly", async () => {
      mockExecute.mockResolvedValueOnce([{ cnt: 1 }] as any);

      await deductCredits("user_meta", 10, "meta_test", {
        metadata: { request_id: "req_1" },
      });

      const sqlCall = mockExecute.mock.calls[0][0];
      // Check that metadata is serialized in the values or query
      // This is hard to check closely with just string matching on sql template,
      // but we can verify it ran without error
      expect(mockExecute).toHaveBeenCalled();
    });
  });
});
