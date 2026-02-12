import type { GatewayBrowserClient } from "../gateway.js";

export interface UserIdentityState {
  client: GatewayBrowserClient | null;
  connected: boolean;

  email: string | null;
  emailVerified: boolean;

  bindingGoogle: boolean;
  bindError: string | null;
  recoverError: string | null;
  recoverSuccess: boolean;
}

export const initialUserIdentityState: UserIdentityState = {
  client: null,
  connected: false,
  email: null,
  emailVerified: false,
  bindingGoogle: false,
  bindError: null,
  recoverError: null,
  recoverSuccess: false,
};

export async function bindGoogle(state: UserIdentityState, credential: string) {
  if (!state.client || !state.connected) {
    state.bindError = "Not connected to gateway";
    return;
  }

  state.bindingGoogle = true;
  state.bindError = null;

  try {
    const res = await state.client.request("payment.bindGoogle", { credential });
    // Response: { email, bonusGranted, balance }
    if (res && typeof res === "object") {
      state.email = (res as any).email;
      state.emailVerified = true;
      return res;
    }
  } catch (err: any) {
    state.bindError = err.message || String(err);
    throw err;
  } finally {
    state.bindingGoogle = false;
  }
}

export async function recoverAccount(state: UserIdentityState, credential: string) {
  if (!state.client) {
    state.recoverError = "Not connected to gateway";
    return;
  }

  state.bindingGoogle = true; // reusing loading state or add new one
  state.recoverError = null;
  state.recoverSuccess = false;

  try {
    const res = await state.client.request("payment.recoverAccount", { credential });
    // Response: { recovered, creditsTransferred, email, balance }
    if (res && (res as any).recovered) {
      state.recoverSuccess = true;
      state.email = (res as any).email;
      state.emailVerified = true;
      return res;
    }
  } catch (err: any) {
    state.recoverError = err.message || String(err);
    throw err;
  } finally {
    state.bindingGoogle = false;
  }
}
