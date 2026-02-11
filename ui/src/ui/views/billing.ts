import { html, nothing } from "lit";
import { BillingState, loadBalance, verifyTransaction } from "../controllers/billing.js";
import { WalletService } from "../services/wallet.js";

export function renderBilling(
  state: BillingState,
  onConfigChange: (patch: Record<string, any>) => void,
) {
  if (!state.client) {
    return html``;
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
        <p class="summary-text">Manage your credits and payment methods.</p>
      </div>

      <div class="billing-content">
        ${renderBalanceCard(state)}
        ${renderAddFunds(state, walletService, onConfigChange)}
      </div>
    </div>
  `;
}

function renderBalanceCard(state: BillingState) {
  return html`
    <div class="card balance-card">
      <div class="card-header">
        <h3>Current Balance</h3>
        <button class="icon-button" @click=${() => loadBalance(state)} ?disabled=${state.balanceLoading}>
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
                $1 USDC = 100 Credits · 1 $POI = 1,000 Credits
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
                >Base</button>
                <button 
                    class="tab ${isTron ? "active" : ""}" 
                    @click=${() => onConfigChange({ selectedChain: "tron", selectedToken: "USDT" })}
                >Tron</button>
            </div>

            ${
              isBase
                ? html`
            <div class="token-selector" style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                <button 
                    class="btn btn--sm ${isUSDC ? "btn--primary" : "btn--secondary"}"
                    @click=${() => onConfigChange({ selectedToken: "USDC" })}
                >USDC</button>
                <button 
                    class="btn btn--sm ${isPOI ? "btn--primary" : "btn--secondary"}"
                    @click=${() => onConfigChange({ selectedToken: "POI" })}
                >$POI</button>
            </div>
            `
                : nothing
            }

            <div class="payment-form">
                <div class="form-group">
                    <label>Amount (${isPOI ? "$POI" : "USD"})</label>
                    <div class="input-wrapper">
                        <span class="prefix">${isPOI ? "" : "$"}</span>
                        <input type="number" id="payment-amount" min="5" step="1" value="10" placeholder="10.00">
                    </div>
                    ${
                      !isPOI
                        ? html`
                            <p class="help-text">Min deposit: $5.00</p>
                          `
                        : nothing
                    }
                </div>

                <div class="conversion-preview">
                    ${
                      isPOI
                        ? html`
                            1 $POI = <strong>1,000 Credits</strong>
                          `
                        : html`
                            $1 USDC = <strong>100 Credits</strong>
                          `
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
      <button class="btn btn--primary btn--loading" disabled>Processing...</button>
      <p class="text-sm text-muted" style="margin-top: 0.5rem; text-align: center">
        Please confirm in your wallet and wait for verification...
      </p>
    `;
  }

  if (state.paymentSuccess) {
    return html`
            <div class="success-banner" style="margin-top: 1rem; padding: 1rem; background: rgba(0, 255, 0, 0.1); border-radius: 8px; text-align: center;">
                <p style="color: #4caf50; font-weight: bold; margin-bottom: 0.5rem;">Payment Successful!</p>
                <p>Added ${state.lastPaymentAmount} credits.</p>
                <button class="btn btn--text" style="margin-top: 0.5rem; text-decoration: underline;" @click=${() => onConfigChange({ paymentSuccess: false })}>Dismiss</button>
            </div>
        `;
  }

  return html`
        <div class="payment-actions">
            <button 
                class="btn btn--primary" 
                style="width: 100%; margin-top: 1rem;"
                @click=${handlePayment}
            >
                ${chain === "base" ? `Pay with ${state.selectedToken}` : `Pay via Tron (USDT)`}
            </button>
            
            ${
              state.paymentError
                ? html`
                <div class="error-banner" style="margin-top: 1rem; padding: 1rem; background: rgba(255, 0, 0, 0.1); border-radius: 8px; color: #ff5252;">
                    ${state.paymentError}
                    <div style="margin-top: 0.5rem;">
                        <button class="btn btn--sm btn--secondary" @click=${() => onConfigChange({ paymentError: null })}>Dismiss</button>
                    </div>
                </div>
             `
                : nothing
            }
        </div>
    `;
}
