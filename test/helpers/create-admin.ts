import { hash } from "argon2";
import * as schema from "src/drizzle/schema";

import { TEST_PASSWORD } from "./consts";
import { db } from "./db";

export const createAdmin = async () => {
  if ((await db.query.workers.findMany()).length === 0) {
    await db.insert(schema.workers).values({
      login: "admin",
      passwordHash: await hash(TEST_PASSWORD),
      role: schema.ZodWorkerRole.Enum.SYSTEM_ADMIN,
    });
  }
};
