// Declare window.ethereum (EIP-1193)

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on?: (eventName: string, handler: (params: any) => void) => void;
      removeListener?: (eventName: string, handler: (params: any) => void) => void;
    };
    tronWeb?: {
      ready: boolean;
      defaultAddress: {
        base58: string;
        hex: string;
      };
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      contract: () => any;
      address: {
        fromHex: (hex: string) => string;
        toHex: (base58: string) => string;
      };
    };
  }
}
