import { faker } from "@faker-js/faker";
import argon2 from "argon2";
import { schema } from "utils/seed/db";
import { v4 as uuidv4 } from "uuid";

export type Worker = typeof schema.workers.$inferInsert;

export default async function mockWorkers(opts: {
  role?: Worker["role"];
  count: number;
}) {
  const { count, role } = opts;

  const passwordHash = await argon2.hash("123456");

  return Array.from({ length: count }, () => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    return {
      id: uuidv4(),
      login: `${faker.internet.userName({
        firstName,
        lastName,
      })}_${faker.number.int({
        min: 1,
        max: 999,
      })}`,
      name: `${firstName} ${lastName}`,
      passwordHash,
      hiredAt: new Date(),
      isBlocked: false,
      onlineAt: new Date(),
      role: faker.helpers.arrayElement([
        "KITCHENER",
        "CASHIER",
        "COURIER",
        "DISPATCHER",
        "WAITER",
        "ADMIN",
      ] as Worker["role"][]),
      ...(role ? { role } : {}),
    } satisfies Worker;
  });
}
