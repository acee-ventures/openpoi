import { eq } from "drizzle-orm";
import { TronWeb } from "tronweb";
import { creditBalance } from "../credits-engine.js";
import { getDb } from "../db.js";
import { CRYPTO_EXCHANGE_RATES } from "../pricing.js";
import { cryptoDeposits } from "../schema.js";

// Environment variables
const TRON_FULL_NODE = process.env.TRON_FULL_NODE || "https://api.trongrid.io";
const TRON_SOLIDITY_NODE = process.env.TRON_SOLIDITY_NODE || "https://api.trongrid.io";
const TRON_EVENT_SERVER = process.env.TRON_EVENT_SERVER || "https://api.trongrid.io";
const TRON_API_KEY = process.env.TRON_API_KEY; // Optional but recommended for higher rate limits

const USDT_TRC20_ADDRESS =
  process.env.VITE_USDT_ADDRESS_TRON || "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"; // Default to Mainnet USDT
const TREASURY_ADDRESS_TRON = process.env.TREASURY_ADDRESS_TRON;

export async function verifyTronTransaction(
  txHash: string,
  userId: string,
): Promise<{ success: boolean; amount?: number; error?: string }> {
  if (!TREASURY_ADDRESS_TRON) {
    return { success: false, error: "Tron treasury address not configured" };
  }

  try {
    const tronWeb = new TronWeb({
      fullNode: TRON_FULL_NODE,
      solidityNode: TRON_SOLIDITY_NODE,
      eventServer: TRON_EVENT_SERVER,
      headers: TRON_API_KEY ? { "TRON-PRO-API-KEY": TRON_API_KEY } : {},
    });

    const tx = await tronWeb.trx.getTransaction(txHash);
    const info = await tronWeb.trx.getTransactionInfo(txHash);

    if (!tx || !info) {
      return { success: false, error: "Transaction not found" };
    }

    // Check transaction status (SUCCESS)
    // In Tron, 'receipt.result' should be 'SUCCESS'
    if (info.receipt?.result !== "SUCCESS") {
      return { success: false, error: "Transaction failed" };
    }

    // Parse specific TRC20 transfer
    // TRC20 transfers are Smart Contract triggers
    // Contract Address must be USDT
    const contractAddress = (tx.raw_data.contract[0].parameter.value as any).contract_address;
    const contractAddressBase58 = tronWeb.address.fromHex(contractAddress);

    if (contractAddressBase58 !== USDT_TRC20_ADDRESS) {
      return { success: false, error: "Not a USDT transaction" };
    }

    // Decode input data to find 'transfer(to, amount)'
    // Method ID: a9059cbb
    const triggerContract = tx.raw_data.contract[0].parameter.value as any;
    const data = triggerContract.data;

    if (!data || !data.startsWith("a9059cbb")) {
      return { success: false, error: "Not a transfer method call" };
    }

    // Parse 'to' address (bytes 16-36 in data, roughly)
    // First 4 bytes method, next 32 bytes address (padded), next 32 bytes amount
    const toAddressHex = "41" + data.substring(32, 72); // Prepend 41 for T-address
    const toAddress = tronWeb.address.fromHex(toAddressHex);

    if (toAddress !== TREASURY_ADDRESS_TRON) {
      return { success: false, error: `Transfer destination mismatch. Found: ${toAddress}` };
    }

    const valueHex = data.substring(72, 136);
    const value = parseInt(valueHex, 16);

    // USDT has 6 decimals
    // 1.0 USDT = 1,000,000 sun/units
    const usdtFloat = value / 1_000_000;
    // 1.0 USDT = 100 Credits (see pricing.ts)
    const credits = Math.floor(usdtFloat * CRYPTO_EXCHANGE_RATES.USDT);

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

    // Record deposit
    try {
      await db.insert(cryptoDeposits).values({
        userId,
        txHash,
        chain: "tron",
        token: "USDT",
        amount: usdtFloat.toString(),
        creditsGranted: credits,
        status: "credited",
        confirmedAt: new Date(),
      });
    } catch (error: any) {
      if (error.code === "23505") {
        return { success: true, amount: credits };
      }
      throw error;
    }

    // Credit user
    await creditBalance(userId, credits, "tron_usdt", "topup", { reference: txHash });

    return { success: true, amount: credits };
  } catch (error: any) {
    console.error("Tron verification error:", error);
    return { success: false, error: error.message };
  }
}
