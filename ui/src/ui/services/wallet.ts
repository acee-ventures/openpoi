import { BaseWalletService } from "./wallet-base.ts";
import { TronWalletService } from "./wallet-tron.ts";

export class WalletService extends EventTarget {
  private static instance: WalletService;
  public base: BaseWalletService;
  public tron: TronWalletService;

  private constructor() {
    super();
    this.base = new BaseWalletService();
    this.tron = new TronWalletService();

    // Propagate connection events
    this.base.addEventListener("connected", (e: any) => {
      this.dispatchEvent(
        new CustomEvent("connected", { detail: { chain: "base", address: e.detail } }),
      );
    });
    this.tron.addEventListener("connected", (e: any) => {
      this.dispatchEvent(
        new CustomEvent("connected", { detail: { chain: "tron", address: e.detail } }),
      );
    });
  }

  public static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  public async connect(chain: "base" | "tron"): Promise<string> {
    if (chain === "base") {
      return this.base.connect();
    } else {
      return this.tron.connect();
    }
  }

  // Helper to disconnect/reset if needed
}

export const walletService = WalletService.getInstance();
