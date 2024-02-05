import dotenv from "dotenv";
import { Pool } from "pg";
import * as schema from "./schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { seedDatabase } from "test/helpers/seed";

dotenv.config();

console.log(process.env.POSTGRESQL_URL);

export async function seed() {
  const pool = new Pool({
    connectionString: process.env.POSTGRESQL_URL,
  });

  const db = drizzle(pool, { schema });

  console.log("Seeding database...");

  await seedDatabase(db);

  console.log("Done!");

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
