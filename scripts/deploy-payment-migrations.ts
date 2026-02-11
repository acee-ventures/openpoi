import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as schema from "../src/payment-hub/schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Error: DATABASE_URL is required");
    process.exit(1);
  }

  console.log("Connecting to database...");
  const client = neon(databaseUrl);
  const db = drizzle(client, { schema });

  const migrationsDir = path.join(__dirname, "../src/payment-hub/migrations");
  const files = fs.readdirSync(migrationsDir).toSorted();

  for (const file of files) {
    if (!file.endsWith(".sql")) {
      continue;
    }

    console.log(`Running migration: ${file}`);
    const filePath = path.join(migrationsDir, file);
    const sqlContent = fs.readFileSync(filePath, "utf-8");

    try {
      // Split by semi-colon if needed, but neon-http might handle multiple statements block
      // Actually neon-http `execute` runs a single query unless wrapped in BEGIN/COMMIT block in SQL string?
      // The SQL files have BEGIN; ... COMMIT; so they should be treated as one command?
      // Wait, neon serverless might not support multi-statement string in one call for `execute`?
      // But `neon` driver does support it.

      // Split by semi-colon to handle multiple statements
      // Remove comments to avoid issues with splitting
      const cleanSql = sqlContent
        .replace(/--.*$/gm, "") // Remove single line comments
        .replace(/\/\*[\s\S]*?\*\//g, ""); // Remove block comments

      const statements = cleanSql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        if (statement.toLowerCase() === "begin" || statement.toLowerCase() === "commit") {
          continue;
        }
        await db.execute(sql.raw(statement));
      }
      console.log(`✓ ${file} applied successfully (${statements.length} statements)`);
    } catch (err) {
      console.error(`✗ Failed to apply ${file}:`, err);
      process.exit(1);
    }
  }

  console.log("All migrations applied.");
}

main().catch(console.error);
