import { db } from "./db";
import { sql } from "drizzle-orm";

export const clearDatabase = async () => {
  // truncate all tables
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

  await Promise.all(
    tables.map((table) =>
      db.execute(sql`TRUNCATE TABLE ${sql.identifier(table)} CASCADE;`),
    ),
  );
};
