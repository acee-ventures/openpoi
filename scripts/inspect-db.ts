import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    process.exit(1);
  }

  const client = neon(databaseUrl);
  const db = drizzle(client);

  console.log("Inspecting users columns:");
  const result = await db.execute(sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users'
  `);
  console.log(JSON.stringify(result, null, 2));

  console.log("\nInspecting user_balances columns:");
  const result2 = await db.execute(sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'user_balances'
  `);
  console.log(JSON.stringify(result2, null, 2));
}

main();
