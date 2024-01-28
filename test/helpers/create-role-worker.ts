import * as schema from "src/drizzle/schema";
import { hash } from "argon2";
import { db } from "./db";
import { TEST_PASSWORD } from "./consts";
import { faker } from "@faker-js/faker";

export const createRoleWorker = async (
  role: schema.WorkerRole,
): Promise<string> => {
  const login = faker.internet.userName();

  await db.insert(schema.workers).values({
    login,
    passwordHash: await hash(TEST_PASSWORD),
    role,
  });

  return login;
};
