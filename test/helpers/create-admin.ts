import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "src/drizzle/schema";
import { hash } from "argon2";

export const createAdmin = async () => {
  const db = drizzle(
    new Pool({ connectionString: process.env.POSTGRESQL_URL }),
    { schema },
  );

  if ((await db.query.workers.findMany()).length === 0) {
    await db.insert(schema.workers).values({
      login: "admin",
      passwordHash: await hash(process.env.INITIAL_ADMIN_PASSWORD),
      role: schema.ZodWorkerRole.Enum.SYSTEM_ADMIN,
    });
  }
};
