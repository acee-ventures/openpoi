import type { GatewayBrowserClient } from "../gateway.js";

export interface BillingState {
  client: GatewayBrowserClient | null;
  connected: boolean;

  balance: {
    poiCredits: number;
    immortalityCredits: number; // For display/migration status if needed
    total: number;
  } | null;
  balanceLoading: boolean;
  balanceError: string | null;

  paymentProcessing: boolean;
  paymentError: string | null;
  paymentSuccess: boolean;
  lastPaymentAmount?: number;

  selectedChain: "base" | "tron";
  selectedToken: "USDC" | "USDT" | "POI";
  walletAddress: string | null;
}

export const initialBillingState: BillingState = {
  client: null,
  connected: false,
  balance: null,
  balanceLoading: false,
  balanceError: null,
  paymentProcessing: false,
  paymentError: null,
  paymentSuccess: false,
  selectedChain: "base",
  selectedToken: "USDC",
  walletAddress: null,
};

export async function loadBalance(state: BillingState) {
  if (!state.client || !state.connected) {
    return;
  }
  if (state.balanceLoading) {
    return;
  }

  state.balanceLoading = true;
  state.balanceError = null;

  try {
    const res = await state.client.request("payment.balance", {});
    if (res) {
      state.balance = res as BillingState["balance"];
    }
  } catch (err: any) {
    state.balanceError = err.message || String(err);
  } finally {
    state.balanceLoading = false;
  }
}

export async function verifyTransaction(state: BillingState, chain: string, txHash: string) {
  if (!state.client) {
    state.paymentError = "Not connected to gateway";
    return;
  }

  // Optimistic UI update
  state.paymentProcessing = true;
  state.paymentError = null;
  state.paymentSuccess = false;

  try {
    const res = (await state.client.request("payment.verify", { chain, txHash })) as {
      success: boolean;
      amount?: number;
      error?: string;
    };

    if (res.success) {
      state.paymentSuccess = true;
      state.lastPaymentAmount = res.amount; // credits amount
      // Refresh balance immediately
      await loadBalance(state);
      return true;
    } else {
      state.paymentError = res.error || "Payment verification failed";
      return false;
    }
  } catch (err: any) {
    state.paymentError = err.message || String(err);
    return false;
  } finally {
    state.paymentProcessing = false;
  }
}
