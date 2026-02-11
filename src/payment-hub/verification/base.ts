import { eq } from "drizzle-orm";
import { ethers } from "ethers";
import { creditBalance } from "../credits-engine.js";
import { getDb } from "../db.js";
import { CRYPTO_EXCHANGE_RATES } from "../pricing.js";
import { cryptoDeposits } from "../schema.js";

// Environment variables should be loaded
const BASE_RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const USDC_ADDRESS =
  process.env.VITE_USDC_ADDRESS_EVM || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Default to Base Mainnet
const POI_ADDRESS = process.env.POI_ADDRESS_EVM || "0x4Bb688D0c5C230303c0032Ff6A678e7A2b56eb3D";
const TREASURY_ADDRESS_EVM = process.env.TREASURY_ADDRESS_EVM;

// USDC/ERC20 ABI (minimal)
const ERC20_ABI = [
  "function transfer(address to, uint256 value) public returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

export async function verifyBaseTransaction(
  txHash: string,
  userId: string,
): Promise<{ success: boolean; amount?: number; error?: string }> {
  if (!TREASURY_ADDRESS_EVM) {
    return { success: false, error: "Treasury address not configured" };
  }

  try {
    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!tx || !receipt) {
      return { success: false, error: "Transaction not found" };
    }

    if (receipt.status !== 1) {
      return { success: false, error: "Transaction failed" };
    }

    // Check if it's a USDC or POI transfer
    let tokenType: "USDC" | "POI" | null = null;
    if (tx.to?.toLowerCase() === USDC_ADDRESS.toLowerCase()) {
      tokenType = "USDC";
    } else if (tx.to?.toLowerCase() === POI_ADDRESS.toLowerCase()) {
      tokenType = "POI";
    } else {
      return { success: false, error: "Not a USDC or POI transaction" };
    }

    // Parse logs to find Transfer event to Treasury
    const iface = new ethers.Interface(ERC20_ABI);
    let amountRaw = BigInt(0);
    let foundTransfer = false;

    for (const log of receipt.logs) {
      if (
        log.address.toLowerCase() !== USDC_ADDRESS.toLowerCase() &&
        log.address.toLowerCase() !== POI_ADDRESS.toLowerCase()
      ) {
        continue;
      }
      try {
        const parsed = iface.parseLog(log);
        if (parsed && parsed.name === "Transfer") {
          const to = parsed.args[1];
          const value = parsed.args[2];

          if (to.toLowerCase() === TREASURY_ADDRESS_EVM.toLowerCase()) {
            amountRaw = value;
            foundTransfer = true;
            // Ensure we match the token type from tx.to (though log address is definitve)
            // If tx.to was the contract, log address should match.
            break;
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    if (!foundTransfer) {
      return { success: false, error: "No transfer to treasury found in transaction" };
    }

    // Convert to Credits
    // USDC (6 decimals): 1.0 USDC = 100 Credits
    // POI (18 decimals): 1.0 POI = 1 Credit (or 100? Assuming 1:1 for simplicity or same value logic)
    // If user said "recharge directly with POI", let's assume 1 POI = 1 Credit for now, or use equivalent value.
    // The previous prompt implies POI is the native token of the platform.

    let credits = 0;
    if (tokenType === "USDC") {
      const usdcFloat = Number(ethers.formatUnits(amountRaw, 6)); // USDC 6 decimals
      credits = Math.floor(usdcFloat * CRYPTO_EXCHANGE_RATES.USDC);
    } else {
      // POI Logic (18 decimals)
      // Fixed utility rate (see pricing.ts)
      const poiFloat = Number(ethers.formatUnits(amountRaw, 18));
      credits = Math.floor(poiFloat * CRYPTO_EXCHANGE_RATES.POI);
    }

    if (credits <= 0) {
      return { success: false, error: "Transaction amount too small for credit conversion" };
    }

    // Idempotency: Check if transaction already processed
    const db = getDb();
    const existing = await db
      .select()
      .from(cryptoDeposits)
      .where(eq(cryptoDeposits.txHash, txHash));
    if (existing.length > 0) {
      return { success: true, amount: existing[0].creditsGranted };
    }

    // Record deposit to prevent double-spending (optimistic locking via unique constraint)
    try {
      await db.insert(cryptoDeposits).values({
        userId,
        txHash,
        chain: "base",
        token: tokenType,
        amount: ethers.formatUnits(amountRaw, tokenType === "USDC" ? 6 : 18),
        creditsGranted: credits,
        status: "credited", // Optimistically mark as credited
        confirmedAt: new Date(),
      });
    } catch (error: any) {
      // P2002 is Prisma, but for Drizzle/Postgres we check for unique constraint violation code '23505'
      if (error.code === "23505") {
        return { success: true, amount: credits };
      }
      // If insert fails for other reasons, re-throw
      throw error;
    }

    // Credit the user
    await creditBalance(userId, credits, tokenType === "USDC" ? "base_usdc" : "base_poi", "topup", {
      reference: txHash,
    });

    return { success: true, amount: credits };
  } catch (error: any) {
    console.error("Base verification error:", error);
    return { success: false, error: error.message };
  }
}
