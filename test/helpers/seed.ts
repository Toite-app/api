import * as argon2 from "argon2";
import { db, schema } from "./db";
import { mockWorkers } from "./mock/workers";
import { TEST_PASSWORD } from "./consts";

export const seedWorkers = async (amount: number) => {
  const passwordHash = await argon2.hash(TEST_PASSWORD);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const data = mockWorkers(amount).map(({ password: _, ...worker }) => ({
    ...worker,
    passwordHash,
  }));

  await db.insert(schema.workers).values(data);
};

export const seedDatabase = async () => {
  await seedWorkers(100);
};
