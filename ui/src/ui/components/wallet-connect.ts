import { html, nothing } from "lit";
import { walletService } from "../services/wallet.js";

export function renderWalletConnect(
  connectedAddress: string | null,
  onConnect: () => void,
  onDisconnect: () => void,
) {
  const shortAddress = connectedAddress
    ? `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}`
    : null;

  return html`
    <div class="wallet-connect">
      ${
        shortAddress
          ? html`
            <div class="wallet-status connected" @click=${onDisconnect} title="Click to disconnect">
              <span class="status-indicator"></span>
              <span class="address">${shortAddress}</span>
            </div>
          `
          : html`
            <button class="btn btn--sm btn--primary" @click=${onConnect}>
              Connect Wallet
            </button>
          `
      }
    </div>
    <style>
      .wallet-connect {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        padding: 4px 0;
      }
      .wallet-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.25rem 0.75rem;
        background: var(--bg-surface-2);
        border: 1px solid var(--border-color);
        border-radius: 999px;
        font-family: monospace;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 100%;
        justify-content: center;
      }
      .wallet-status:hover {
        background: var(--bg-surface-3);
        border-color: var(--primary-color);
      }
      .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: var(--success-color, #10b981);
        box-shadow: 0 0 8px var(--success-color, #10b981);
      }
      .wallet-connect button {
        width: 100%;
      }
    </style>
  `;
}
