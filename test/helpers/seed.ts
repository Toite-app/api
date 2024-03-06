import * as argon2 from "argon2";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

import { TEST_PASSWORD } from "./consts";
import { db as defaultDb, schema } from "./db";
import { mockWorkers } from "./mock/workers";

export const seedWorkers = async (
  db: NodePgDatabase<typeof schema>,
  amount: number,
) => {
  console.log("Seeding workers...");
  const passwordHash = await argon2.hash(TEST_PASSWORD);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const data = mockWorkers(amount).map(({ password: _, ...worker }) => ({
    ...worker,
    passwordHash,
  }));

  await db.insert(schema.workers).values(data);
};

export const seedDatabase = async (
  db: NodePgDatabase<typeof schema> = defaultDb,
) => {
  await seedWorkers(db, 100);
};
