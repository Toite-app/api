import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

dotenv.config();

const POSTGRESQL_URL = process.env.POSTGRESQL_URL;

if (!POSTGRESQL_URL) {
  console.error("POSTGRESQL_URL environment variable is required");
  process.exit(1);
}

export async function startMigration(): Promise<void> {
  const pool = new Pool({
    connectionString: POSTGRESQL_URL,
    ssl: POSTGRESQL_URL?.includes("sslmode=required") ? true : false,
  });

  const db = drizzle(pool);

  console.log("Migrating database...");

  await migrate(db, {
    migrationsFolder: "./src/@base/drizzle/migrations",
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });

  console.log("Done!");
  await pool.end();
  process.exit(0);
}

startMigration().catch((err) => {
  console.error(err);
  process.exit(1);
});
