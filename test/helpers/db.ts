import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "src/drizzle/schema";

export const db = drizzle(
  new Pool({ connectionString: process.env.POSTGRESQL_URL }),
  { schema },
);

export { schema };
