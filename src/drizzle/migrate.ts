import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.POSTGRESQL_URL,
});

const db = drizzle(pool);

async function main() {
  console.log("Migrating database...");
  await migrate(db, {
    migrationsFolder: "./src/drizzle/migrations",
  });

  console.log("Done!");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
