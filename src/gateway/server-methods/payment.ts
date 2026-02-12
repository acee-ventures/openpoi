import type { GatewayRequestHandlers } from "./types.js";
import { grantWalletBonus, grantEmailBonus } from "../../payment-hub/credits-bonus.js";
import { getBalance } from "../../payment-hub/credits-engine.js";
import {
  bindGoogle,
  bindWallet,
  recoverByGoogle,
  getAccountInfo,
} from "../../payment-hub/identity-service.js";
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

  // ─── Progressive Identity RPCs ──────────────────────────────────────────

  /**
   * Bind Google account via ID Token (from Google Sign-In).
   * Frontend gets credential via Google Identity Services JS SDK,
   * sends it here. Backend verifies + binds + grants bonus.
   *
   * Params: { credential: string }  // Google ID Token JWT
   * Returns: { email, bonusGranted, balance }
   */
  "payment.bindGoogle": async ({ params, respond, client }) => {
    const userId = client?.connect?.client?.id;
    if (!userId) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "User not authenticated"));
      return;
    }

    const { credential } = params as { credential?: string };
    if (!credential) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "Missing credential"));
      return;
    }

    try {
      const result = await bindGoogle(userId, credential);
      const balance = await getBalance(userId);
      respond(true, { email: result.email, bonusGranted: result.bonusGranted, balance });
    } catch (e: any) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, e.message));
    }
  },

  /**
   * Bind wallet to account and claim bonus.
   * Params: { walletAddress: string }
   * Returns: { bonusGranted, balance }
   */
  "payment.bindWallet": async ({ params, respond, client }) => {
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
      const result = await bindWallet(userId, walletAddress);
      const balance = await getBalance(userId);
      respond(true, { bonusGranted: result.bonusGranted, balance });
    } catch (e: any) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, e.message));
    }
  },

  /**
   * Recover account via Google identity.
   * User signs in with Google on new device → backend finds old account → transfers credits.
   *
   * Params: { credential: string }  // Google ID Token JWT
   * Returns: { recovered, creditsTransferred, balance }
   */
  "payment.recoverAccount": async ({ params, respond, client }) => {
    const userId = client?.connect?.client?.id;
    if (!userId) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "User not authenticated"));
      return;
    }

    const { credential } = params as { credential?: string };
    if (!credential) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "Missing credential"));
      return;
    }

    try {
      const result = await recoverByGoogle(credential, userId);
      if (!result.recovered) {
        respond(
          false,
          undefined,
          errorShape(
            ErrorCodes.INVALID_REQUEST,
            "No previous account found for this Google account",
          ),
        );
        return;
      }
      const balance = await getBalance(userId);
      respond(true, {
        recovered: true,
        creditsTransferred: result.creditsTransferred,
        email: result.email,
        balance,
      });
    } catch (e: any) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, e.message));
    }
  },

  /**
   * Get account identity info.
   * Returns: { userId, email, emailVerified, walletAddress, identityCount }
   */
  "payment.accountInfo": async ({ respond, client }) => {
    const userId = client?.connect?.client?.id;
    if (!userId) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "User not authenticated"));
      return;
    }

    try {
      const info = await getAccountInfo(userId);
      respond(true, info);
    } catch (e: any) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, e.message));
    }
  },
};
