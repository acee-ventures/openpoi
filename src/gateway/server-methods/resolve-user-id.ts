import type { GatewayClient } from "./types.js";

/**
 * Resolve a billing-grade userId from the connected client.
 *
 * Priority:
 *   1. Google-bound identity  → "google:{sub}"   (set after payment.bindGoogle)
 *   2. Device identity        → "device:{id}"    (browser-generated keypair)
 *   3. null                   → unauthenticated
 *
 * The old code used `client?.connect?.client?.id` which always resolved
 * to the static string "openclaw-control-ui" for all web users — a bug
 * that made every anonymous visitor share the same credit balance.
 */
export function resolveUserId(client: GatewayClient | null | undefined): string | null {
  if (!client?.connect) {
    return null;
  }

  // Priority 1: Google-bound identity (set at runtime after bindGoogle)
  const googleSub = (client as any)._googleSub as string | undefined;
  if (googleSub) {
    return `google:${googleSub}`;
  }

  // Priority 2: Device identity (crypto keypair generated per browser)
  const deviceId = client.connect.device?.id;
  if (deviceId) {
    return `device:${deviceId}`;
  }

  // No usable identity — caller should treat as unauthenticated
  return null;
}

/**
 * Attach a verified Google sub to the client's runtime state.
 * Called after successful Google ID Token verification in payment.bindGoogle.
 */
export function setGoogleSub(client: GatewayClient, googleSub: string): void {
  (client as any)._googleSub = googleSub;
}

/**
 * Read the Google sub from client runtime state (if bound).
 */
export function getGoogleSub(client: GatewayClient | null | undefined): string | undefined {
  return (client as any)?._googleSub as string | undefined;
}
