import { ethers } from "ethers";

// Base Mainnet config
// Base Chain Config (Mainnet or Sepolia)
const BASE_CHAIN_ID_DECIMAL = import.meta.env.VITE_CHAIN_ID || "8453";
const BASE_CHAIN_ID = "0x" + Number(BASE_CHAIN_ID_DECIMAL).toString(16);
const BASE_RPC = import.meta.env.VITE_BASE_RPC_URL || "https://mainnet.base.org";
const USDC_ADDRESS =
  import.meta.env.VITE_USDC_ADDRESS_EVM || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const TREASURY_ADDRESS =
  import.meta.env.VITE_TREASURY_ADDRESS_EVM || "0x4ba854FB0797f8F0a8E37f004d6B5a914A8D68D8"; // Mainnet Safe
const POI_ADDRESS =
  import.meta.env.VITE_POI_ADDRESS_EVM || "0xD3a3a3348B28A6C816644A642E36B2Cc2FFe8Fa8"; // Mainnet Proxy

const ERC20_ABI = [
  "function transfer(address to, uint256 value) public returns (bool)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
];

export class BaseWalletService extends EventTarget {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  public address: string | null = null;
  public isConnected = false;

  constructor() {
    super();
    if (window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
    }
  }

  async connect(): Promise<string> {
    if (!this.provider) {
      throw new Error("Metamask not installed");
    }

    await this.provider.send("eth_requestAccounts", []);
    this.signer = await this.provider.getSigner();
    this.address = await this.signer.getAddress();

    // Switch network first
    await this.switchToBase();

    this.isConnected = true;

    this.dispatchEvent(new CustomEvent("connected", { detail: this.address }));
    return this.address;
  }

  async switchToBase() {
    if (!this.provider) {
      return;
    }
    try {
      await this.provider.send("wallet_switchEthereumChain", [{ chainId: BASE_CHAIN_ID }]);
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await this.provider.send("wallet_addEthereumChain", [
            {
              chainId: BASE_CHAIN_ID,
              chainName: Number(BASE_CHAIN_ID_DECIMAL) === 84532 ? "Base Sepolia" : "Base Mainnet",
              rpcUrls: [BASE_RPC],
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              blockExplorerUrls: ["https://basescan.org"],
            },
          ]);
        } catch (addError) {
          console.error("Failed to add Base network:", addError);
          throw addError;
        }
      } else {
        console.error("Failed to switch to Base network:", switchError);
        throw switchError;
      }
    }
  }

  async getUSDCBalance(): Promise<string> {
    if (!this.signer) {
      return "0";
    }
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, this.signer);
    const balance = await usdc.balanceOf(this.address);
    return ethers.formatUnits(balance, 6);
  }

  async sendUSDC(amount: number): Promise<string> {
    if (!this.signer) {
      throw new Error("Wallet not connected");
    }
    if (!TREASURY_ADDRESS) {
      throw new Error("Treasury address not configured");
    }

    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, this.signer);
    const amountUnits = ethers.parseUnits(amount.toString(), 6);

    const tx = await usdc.transfer(TREASURY_ADDRESS, amountUnits);
    await tx.wait(); // Wait for 1 confirmation

    return tx.hash;
  }

  async getPOIBalance(): Promise<string> {
    if (!this.signer) {
      return "0";
    }
    const poi = new ethers.Contract(POI_ADDRESS, ERC20_ABI, this.signer);
    const balance = await poi.balanceOf(this.address);
    return ethers.formatUnits(balance, 18); // POI is 18 decimals
  }

  async sendPOI(amount: number): Promise<string> {
    if (!this.signer) {
      throw new Error("Wallet not connected");
    }
    if (!TREASURY_ADDRESS) {
      throw new Error("Treasury address not configured");
    }

    const poi = new ethers.Contract(POI_ADDRESS, ERC20_ABI, this.signer);
    const amountUnits = ethers.parseUnits(amount.toString(), 18);

    const tx = await poi.transfer(TREASURY_ADDRESS, amountUnits);
    await tx.wait();

    return tx.hash;
  }
}
