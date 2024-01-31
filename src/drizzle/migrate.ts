import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import dotenv from "dotenv";

dotenv.config();

export async function startMigration() {
  const pool = new Pool({
    connectionString: process.env.POSTGRESQL_URL,
  });

  const db = drizzle(pool);

  console.log("Migrating database...");

  await migrate(db, {
    migrationsFolder: "./src/drizzle/migrations",
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });

  console.log("Done!");

  process.exit(0);
}

startMigration().catch((err) => {
  console.error(err);
  process.exit(1);
});
