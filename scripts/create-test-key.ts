import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { createHash, randomBytes } from "node:crypto";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    process.exit(1);
  }

  const client = neon(databaseUrl);
  const db = drizzle(client);

  const userId = "test-user-001";
  const username = "tester";
  const email = "tester@example.com";

  console.log("Seeding test user...");
  await db.execute(sql`
    INSERT INTO users (id, username, email, created_at, updated_at)
    VALUES (${userId}, ${username}, ${email}, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  `);

  console.log("Seeding user balance...");
  await db.execute(sql`
    INSERT INTO user_balances (user_id, poi_credits, immortality_credits, updated_at)
    VALUES (${userId}, 100000, 0, NOW())
    ON CONFLICT (user_id) DO UPDATE SET poi_credits = 100000
  `);

  // Generate Key
  const keyHex = randomBytes(32).toString("hex"); // 64 chars
  const fullKey = `poi_sk_${keyHex}`;
  const keyHash = createHash("sha256").update(fullKey).digest("hex");

  console.log("Seeding API key...");
  await db.execute(sql`
    INSERT INTO poi_api_keys (user_id, key_hash, key_prefix, name, created_at)
    VALUES (${userId}, ${keyHash}, 'poi_sk_xxxx', 'Test Key', NOW())
    ON CONFLICT (key_hash) DO NOTHING
  `);

  console.log("\n✅ Test Data Ready");
  console.log(`User ID: ${userId}`);
  console.log(`API Key: ${fullKey}`);
  console.log("Use this key in Authorization: Bearer <key>");
}

main();
