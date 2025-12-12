import env from "@core/env";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

dotenv.config();

export async function startMigration() {
  const pool = new Pool({
    connectionString: env.POSTGRESQL_URL,
    ssl:
      env.NODE_ENV === "production" &&
      String(env.POSTGRESQL_URL).indexOf("sslmode=required") !== -1
        ? true
        : false,
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
