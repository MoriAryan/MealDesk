import fs from "fs";
import path from "path";
import pg from "pg";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function main() {
  const sqlFileArg = process.argv[2];

  if (!sqlFileArg) {
    throw new Error("Usage: node scripts/run-sql.js <path-to-sql-file>");
  }

  const sqlPath = path.isAbsolute(sqlFileArg)
    ? sqlFileArg
    : path.resolve(__dirname, "..", "..", sqlFileArg);

  if (!fs.existsSync(sqlPath)) {
    throw new Error(`SQL file not found: ${sqlPath}`);
  }

  const connectionString = process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    throw new Error("Missing SUPABASE_DB_URL in backend/.env");
  }

  const sql = fs.readFileSync(sqlPath, "utf8");
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  await client.connect();
  await client.query(sql);
  await client.end();

  console.log(`Executed SQL: ${path.basename(sqlPath)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
