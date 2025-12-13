import { faker } from "@faker-js/faker";
import { v4 as uuidv4 } from "uuid";

import { schema } from "../db";

export type Worker = typeof schema.workers.$inferInsert;
export type WorkerRole = Worker["role"];

export interface MockWorkersOptions {
  count: number;
  role?: WorkerRole;
  passwordHash: string;
}

export function mockWorkers(opts: MockWorkersOptions): Worker[] {
  const { count, role, passwordHash } = opts;

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
      role:
        role ??
        faker.helpers.arrayElement([
          "KITCHENER",
          "CASHIER",
          "COURIER",
          "DISPATCHER",
          "WAITER",
          "ADMIN",
        ] as WorkerRole[]),
    } satisfies Worker;
  });
}

export function mockSystemAdmin(passwordHash: string): Worker {
  return {
    id: uuidv4(),
    login: "admin",
    name: "System Administrator",
    passwordHash,
    hiredAt: new Date(),
    isBlocked: false,
    onlineAt: new Date(),
    role: "SYSTEM_ADMIN",
  };
}
