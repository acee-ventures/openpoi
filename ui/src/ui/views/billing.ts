import { html, nothing } from "lit";
import { BillingState, loadBalance, verifyTransaction } from "../controllers/billing.js";
import { WalletService } from "../services/wallet.js";
import "../components/google-signin.js";

export function renderBilling(
  state: BillingState,
  onConfigChange: (patch: Record<string, any>) => void,
  opts?: {
    isAuthenticated?: boolean;
    googleClientId?: string | null;
    onGoogleSignIn?: (credential: string) => void;
  },
) {
  if (!state.client) {
    return html``;
  }

  // Auth gate: require Google Sign-In before showing billing
  if (!opts?.isAuthenticated) {
    return html`
      <div class="billing-container">
        <div class="billing-header">
          <h2>Billing & Credits</h2>
          <p class="summary-text">Sign in with Google to view your credits and start chatting.</p>
        </div>
        <div class="billing-content">
          <div class="card" style="text-align: center; padding: 40px 20px;">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--fg-muted)"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="margin-bottom: 16px; opacity: 0.6"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            <p style="margin-bottom: 20px; color: var(--fg-muted);">
              Sign in to unlock <strong>1,000 free credits</strong> and start using the AI assistant.
            </p>
            ${
              opts?.googleClientId
                ? html`
                <google-signin-button
                  .clientId=${opts.googleClientId}
                  theme="filled_blue"
                  size="large"
                  text="signin_with"
                  shape="pill"
                  @success=${(e: CustomEvent) => {
                    opts?.onGoogleSignIn?.(e.detail.credential);
                  }}
                ></google-signin-button>
              `
                : html`
                    <p class="muted">Google Sign-In is not configured.</p>
                  `
            }
          </div>
        </div>
      </div>
    `;
  }

  // Load balance on first render if not loaded/loading
  if (!state.balance && !state.balanceLoading && !state.balanceError) {
    setTimeout(() => loadBalance(state), 0);
  }

  const walletService = WalletService.getInstance();

  return html`
    <div class="billing-container">
      <div class="billing-header">
        <h2>Billing & Credits</h2>
        <p class="summary-text">Manage your POI credits and add funds via crypto.</p>
      </div>

      <div class="billing-content">
        ${renderBalanceCard(state)}
        ${renderAddFunds(state, walletService, onConfigChange)}
        ${renderPricingInfo()}
      </div>
    </div>
  `;
}

function renderBalanceCard(state: BillingState) {
  return html`
    <div class="card balance-card">
      <div class="card-header">
        <h3>Current Balance</h3>
        <button
          class="icon-button"
          title="Refresh balance"
          @click=${() => loadBalance(state)}
          ?disabled=${state.balanceLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
        </button>
      </div>
      <div class="balance-display">
        ${
          state.balanceLoading && !state.balance
            ? html`
                <div class="loading-spinner"></div>
              `
            : html`
                <div class="balance-amount">
                  <span class="currency-symbol">Credits</span>
                  <span class="value">${state.balance ? state.balance.poiCredits.toLocaleString() : "0"}</span>
                </div>
                <div class="balance-sub">
                  ${
                    state.balance?.immortalityCredits
                      ? html`<span>Legacy balance: ${state.balance.immortalityCredits.toLocaleString()} credits</span>`
                      : nothing
                  }
                </div>
              `
        }
      </div>
      ${state.balanceError ? html`<div class="error-banner">${state.balanceError}</div>` : nothing}
    </div>
  `;
}

function renderAddFunds(
  state: BillingState,
  walletService: WalletService,
  onConfigChange: (patch: Record<string, any>) => void,
) {
  const isBase = state.selectedChain === "base";
  const isTron = state.selectedChain === "tron";
  const isUSDC = state.selectedToken === "USDC";
  const isPOI = state.selectedToken === "POI";

  return html`
    <div class="card add-funds-card">
      <div class="card-header">
        <h3>Add Funds</h3>
      </div>

      <div class="tabs">
        <button
          class="tab ${isBase ? "active" : ""}"
          @click=${() => onConfigChange({ selectedChain: "base", selectedToken: "USDC" })}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 6px;"><circle cx="12" cy="12" r="10"/><path d="m16 10-5.5 6L8 13.5"/></svg>
          Base (ETH L2)
        </button>
        <button
          class="tab ${isTron ? "active" : ""}"
          @click=${() => onConfigChange({ selectedChain: "tron", selectedToken: "USDT" })}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 6px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          Tron
        </button>
      </div>

      ${
        isBase
          ? html`
              <div class="token-selector">
                <button
                  class="btn btn--sm ${isUSDC ? "active" : ""}"
                  @click=${() => onConfigChange({ selectedToken: "USDC" })}
                >USDC</button>
                <button
                  class="btn btn--sm ${isPOI ? "active" : ""}"
                  @click=${() => onConfigChange({ selectedToken: "POI" })}
                >$POI</button>
              </div>
            `
          : nothing
      }

      <div class="payment-form">
        <div class="form-group">
          <label>Amount (${isPOI ? "$POI" : isBase ? "USDC" : "USDT"})</label>
          <div class="input-wrapper">
            <span class="prefix">${isPOI ? "POI" : "$"}</span>
            <input
              type="number"
              id="payment-amount"
              min="1"
              step="1"
              value="10"
              placeholder="${isPOI ? "100" : "10"}"
            >
          </div>
        </div>

        <div class="conversion-preview">
          ${
            isPOI
              ? html`
                  1 $POI = <strong>1,000 Credits</strong>
                `
              : html`$1 ${isBase ? "USDC" : "USDT"} = <strong>100 Credits</strong>`
          }
        </div>

        ${renderPaymentActions(state, walletService, onConfigChange)}
      </div>
    </div>
  `;
}

function renderPaymentActions(
  state: BillingState,
  walletService: WalletService,
  onConfigChange: (patch: Record<string, any>) => void,
) {
  const chain = state.selectedChain;

  async function handlePayment() {
    if (!state.client) {
      onConfigChange({
        paymentError: "Not connected to gateway. Please wait for connection or refresh the page.",
      });
      return;
    }

    const amountInput = document.getElementById("payment-amount") as HTMLInputElement;
    const amount = parseFloat(amountInput?.value || "0");

    if (!amount || amount < 1) {
      onConfigChange({ paymentError: "Please enter a valid amount (minimum 1)" });
      return;
    }

    try {
      onConfigChange({ paymentProcessing: true, paymentError: null });

      // 1. Connect Wallet
      await walletService.connect(chain);

      // 2. Send Transaction
      let txHash = "";
      if (chain === "base") {
        if (state.selectedToken === "POI") {
          txHash = await walletService.base.sendPOI(amount);
        } else {
          txHash = await walletService.base.sendUSDC(amount);
        }
      } else {
        txHash = await walletService.tron.sendUSDT(amount);
      }

      // 3. Verify & Poll
      const result = await verifyTransaction(state, chain, txHash);

      // Propagate state changes from verifyTransaction back to LitElement
      // verifyTransaction mutates `state` directly but that doesn't trigger re-render
      onConfigChange({
        paymentProcessing: state.paymentProcessing,
        paymentError: state.paymentError,
        paymentSuccess: state.paymentSuccess,
        lastPaymentAmount: state.lastPaymentAmount,
        balance: state.balance,
      });
    } catch (e: any) {
      console.error("Payment flow error", e);
      let errorMessage = e.message || String(e);

      if (errorMessage.includes("User rejected") || e.code === 4001) {
        errorMessage = "Transaction cancelled by user";
      }

      onConfigChange({
        paymentProcessing: false,
        paymentError: errorMessage,
      });
    }
  }

  if (state.paymentProcessing) {
    return html`
      <div class="payment-actions">
        <button class="btn primary btn--loading" disabled>
          <div class="loading-spinner" style="width: 16px; height: 16px; border-width: 2px"></div>
          Processing...
        </button>
        <p class="help-text" style="text-align: center">
          Please confirm in your wallet and wait for on-chain verification...
        </p>
      </div>
    `;
  }

  if (state.paymentSuccess) {
    return html`
      <div class="success-banner">
        <p style="font-weight: 700; font-size: 15px; color: var(--ok);">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -3px; margin-right: 6px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Payment Successful!
        </p>
        <p style="color: var(--text); font-size: 14px;">
          Added <strong>${state.lastPaymentAmount?.toLocaleString()}</strong> credits to your account.
        </p>
        <button class="btn btn--sm" style="margin-top: 8px;" @click=${() => onConfigChange({ paymentSuccess: false })}>
          Continue
        </button>
      </div>
    `;
  }

  return html`
    <div class="payment-actions">
      <button
        class="btn primary"
        style="width: 100%;"
        @click=${handlePayment}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
        ${chain === "base" ? `Pay with ${state.selectedToken}` : `Pay with USDT (Tron)`}
      </button>

      ${
        state.paymentError
          ? html`
              <div class="error-banner">
                <span>${state.paymentError}</span>
                <button
                  class="btn btn--sm"
                  style="margin-top: 8px;"
                  @click=${() => onConfigChange({ paymentError: null })}
                >Dismiss</button>
              </div>
            `
          : nothing
      }

      ${
        state.walletAddress
          ? html`
              <p class="help-text" style="text-align: center;">
                Wallet: <code style="font-family: var(--mono); font-size: 11px;">${state.walletAddress.slice(0, 6)}...${state.walletAddress.slice(-4)}</code>
              </p>
            `
          : nothing
      }
    </div>
  `;
}

function renderPricingInfo() {
  return html`
    <div class="card" style="animation-delay: 150ms">
      <div class="card-header" style="margin-bottom: 12px">
        <h3
          style="
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--muted);
            margin: 0;
          "
        >
          Credit Rates
        </h3>
      </div>
      <div class="status-list" style="font-size: 13px">
        <div>
          <span>GPT-5.3</span>
          <span style="font-weight: 500; color: var(--text-strong)">5 credits / message</span>
        </div>
        <div>
          <span>Claude Opus 4.6</span>
          <span style="font-weight: 500; color: var(--text-strong)">8 credits / message</span>
        </div>
        <div>
          <span>Gemini 3 Pro</span>
          <span style="font-weight: 500; color: var(--text-strong)">4 credits / message</span>
        </div>
        <div>
          <span>Grok xAI 4.1</span>
          <span style="font-weight: 500; color: var(--text-strong)">6 credits / message</span>
        </div>
        <div>
          <span>Image Generation</span>
          <span style="font-weight: 500; color: var(--text-strong)">10 credits / image</span>
        </div>
      </div>
      <p class="help-text" style="margin-top: 12px">
        Credit rates may vary. Visit our
        <a href="https://docs.aceexventures.com/pricing" target="_blank" rel="noopener">pricing page</a>
        for details.
      </p>
    </div>
  `;
}
