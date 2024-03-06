import dotenv from "dotenv";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

dotenv.config({
  path: process.env.NODE_ENV === "test" ? "./.env.test" : "./.env",
});

const clearDatabase = async () => {
  const pool = new Pool({
    connectionString: process.env.POSTGRESQL_URL,
  });

  const db = drizzle(pool);

  console.log("Clearing database...");

  const tables = await db
    .execute(
      sql`   
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE';
      `,
    )
    .then((res) => res.rows.map((row) => row.table_name));
  console.log("🚀 ~ clearDatabase ~ tables:", tables);

  await Promise.all(
    tables.map((table) =>
      db.execute(sql`TRUNCATE TABLE ${sql.identifier(table)};`),
    ),
  );

  console.log("Done!");

  process.exit(0);
};

clearDatabase().catch((err) => {
  console.error(err);
  process.exit(1);
});
