import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const client = neon(databaseUrl);
  const db = drizzle(client);

  console.log("Checking crypto_deposits:");
  const deposits = await db.execute(sql`
    SELECT * FROM crypto_deposits ORDER BY created_at DESC LIMIT 5
  `);
  console.log(JSON.stringify(deposits, null, 2));

  console.log("\nChecking user balances:");
  const balances = await db.execute(sql`
    SELECT * FROM user_balances LIMIT 5
  `);
  console.log(JSON.stringify(balances, null, 2));
}

main();
