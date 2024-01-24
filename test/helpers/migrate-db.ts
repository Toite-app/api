import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate as _migrate } from "drizzle-orm/node-postgres/migrator";

export const migrate = async () => {
  const pool = new Pool({
    connectionString: process.env.POSTGRESQL_URL,
  });

  const db = drizzle(pool);

  await _migrate(db, {
    migrationsFolder: "./src/drizzle/migrations",
  });
};
