import type { GatewayRequestHandlers } from "./types.js";
import { getBalance } from "../../payment-hub/credits-engine.js";
import { verifyBaseTransaction } from "../../payment-hub/verification/base.js";
import { verifyTronTransaction } from "../../payment-hub/verification/tron.js";
import { ErrorCodes, errorShape } from "../protocol/index.js"; // Adjust import

// Ensure protocol/index.js is correct import
// Typically ErrorCodes is exported from "../protocol.js" or similar in this codebase
// Based on server-methods.ts: import { ErrorCodes, errorShape } from "./protocol/index.js"; -> THIS SEEMS WRONG relative path in server-methods.ts vs here.
// server-methods.ts is at src/gateway/server-methods.ts. imports from "./protocol/index.js".
// So protocol is at src/gateway/protocol/index.js.
// Since this file is src/gateway/server-methods/payment.ts, import should be "../protocol/index.js".

export const paymentHandlers: GatewayRequestHandlers = {
  "payment.balance": async ({ respond, client }) => {
    const userId = client?.connect?.client?.id;
    if (!userId) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "User not authenticated"));
      return;
    }

    try {
      const balance = await getBalance(userId);
      respond(true, balance);
    } catch (e: any) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, e.message));
    }
  },

  "payment.verify": async ({ params, respond, client }) => {
    const { chain, txHash } = params as { chain: string; txHash: string };

    if (!chain || !txHash) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "Missing chain or txHash"));
      return;
    }

    // Resolve User ID (Authenticated User or Session)
    const userId = client?.connect?.client?.id;
    if (!userId) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "User not authenticated"));
      return;
    }

    let result;
    try {
      if (chain === "base") {
        result = await verifyBaseTransaction(txHash, userId);
      } else if (chain === "tron") {
        result = await verifyTronTransaction(txHash, userId);
      } else {
        respond(
          false,
          undefined,
          errorShape(ErrorCodes.INVALID_REQUEST, `Unsupported chain: ${chain}`),
        );
        return;
      }

      if (result.success) {
        respond(true, { success: true, amount: result.amount });
      } else {
        respond(
          false,
          undefined,
          errorShape(ErrorCodes.INVALID_REQUEST, result.error || "Verification failed"),
        );
      }
    } catch (e: any) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, e.message));
    }
  },
};
