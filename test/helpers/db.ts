import { schema } from "@postgress-db/drizzle.module";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export const db = drizzle(
  new Pool({ connectionString: process.env.POSTGRESQL_URL }),
  { schema },
);

export { schema };
