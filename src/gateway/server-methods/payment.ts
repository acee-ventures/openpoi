import type { GatewayRequestHandlers } from "./types.js";
import { grantWalletBonus, grantEmailBonus } from "../../payment-hub/credits-bonus.js";
import { getBalance } from "../../payment-hub/credits-engine.js";
import { verifyBaseTransaction } from "../../payment-hub/verification/base.js";
import { verifyTronTransaction } from "../../payment-hub/verification/tron.js";
import { ErrorCodes, errorShape } from "../protocol/index.js";

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

  /**
   * Claim wallet-connection bonus (5,000 credits). Idempotent.
   * Params: { walletAddress: string }
   */
  "payment.claimWalletBonus": async ({ params, respond, client }) => {
    const userId = client?.connect?.client?.id;
    if (!userId) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "User not authenticated"));
      return;
    }

    const { walletAddress } = params as { walletAddress?: string };
    if (!walletAddress) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "Missing walletAddress"));
      return;
    }

    try {
      const granted = await grantWalletBonus(userId, walletAddress);
      const balance = await getBalance(userId);
      respond(true, { granted, balance });
    } catch (e: any) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, e.message));
    }
  },

  /**
   * Claim email-registration bonus (10,000 credits). Idempotent.
   * Params: { email: string }
   */
  "payment.claimEmailBonus": async ({ params, respond, client }) => {
    const userId = client?.connect?.client?.id;
    if (!userId) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "User not authenticated"));
      return;
    }

    const { email } = params as { email?: string };
    if (!email) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "Missing email"));
      return;
    }

    try {
      const granted = await grantEmailBonus(userId, email);
      const balance = await getBalance(userId);
      respond(true, { granted, balance });
    } catch (e: any) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, e.message));
    }
  },
};
