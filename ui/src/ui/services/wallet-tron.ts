// TronLink injects `tronWeb`

const USDT_ADDRESS = import.meta.env.VITE_USDT_ADDRESS_TRON || "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const TREASURY_ADDRESS_TRON = import.meta.env.VITE_TREASURY_ADDRESS_TRON; // From .env

export class TronWalletService extends EventTarget {
  public address: string | null = null;
  public isConnected = false;

  async connect(): Promise<string> {
    if (!window.tronWeb) {
      throw new Error("TronLink not installed");
    }

    // TronLink logic: check if ready (unlocked & authorized)
    if (window.tronWeb.ready && window.tronWeb.defaultAddress.base58) {
      this.address = window.tronWeb.defaultAddress.base58;
      this.isConnected = true;
      this.dispatchEvent(new CustomEvent("connected", { detail: this.address }));
      return this.address!;
    } else {
      // Request access
      const res = await window.tronWeb.request({ method: "tron_requestAccounts" });

      if (res.code === 200) {
        // Wait briefly for tronWeb.ready to become true after auth
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (window.tronWeb.defaultAddress.base58) {
          this.address = window.tronWeb.defaultAddress.base58;
          this.isConnected = true;
          this.dispatchEvent(new CustomEvent("connected", { detail: this.address }));
          return this.address!;
        }
      }

      throw new Error("User rejected connection or TronLink not ready");
    }
  }

  async getUSDTBalance(): Promise<string> {
    if (!this.address) {
      return "0";
    }
    try {
      if (!window.tronWeb) {
        throw new Error("TronLink not available");
      }
      const contract = await window.tronWeb.contract().at(USDT_ADDRESS);
      const balance = await contract.balanceOf(this.address).call();
      // USDT has 6 decimals
      return (parseInt(balance._hex, 16) / 1000000).toString();
    } catch (e) {
      console.error("Failed to get balance", e);
      return "0";
    }
  }

  async sendUSDT(amount: number): Promise<string> {
    if (!this.isConnected || !this.address) {
      throw new Error("Wallet not connected");
    }
    if (!TREASURY_ADDRESS_TRON) {
      throw new Error("Treasury address not configured");
    }

    try {
      if (!window.tronWeb) {
        throw new Error("TronLink not available");
      }
      const contract = await window.tronWeb.contract().at(USDT_ADDRESS);
      const amountUnits = amount * 1000000;

      const txId = await contract.transfer(TREASURY_ADDRESS_TRON, amountUnits).send();

      return txId;
    } catch (e) {
      console.error("Transfer failed", e);
      throw e;
    }
  }
}
