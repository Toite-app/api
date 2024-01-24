import * as schema from "src/drizzle/schema";
import { hash } from "argon2";
import { db } from "./db";
import { TEST_PASSWORD } from "./consts";

export const createAdmin = async () => {
  if ((await db.query.workers.findMany()).length === 0) {
    await db.insert(schema.workers).values({
      login: "admin",
      passwordHash: await hash(TEST_PASSWORD),
      role: schema.ZodWorkerRole.Enum.SYSTEM_ADMIN,
    });
  }
};
