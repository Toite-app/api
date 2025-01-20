import { faker } from "@faker-js/faker";
import * as argon2 from "argon2";
import { DatabaseHelper, schema } from "test/helpers/database";

import { TEST_PASSWORD } from "../consts";

export const mockWorkers = async (
  length: number = 20,
): Promise<(typeof schema.workers.$inferInsert)[]> => {
  const restaurants = await DatabaseHelper.pg
    .select({
      id: schema.restaurants.id,
    })
    .from(schema.restaurants);

  const passwordHash = await argon2.hash(TEST_PASSWORD);
  return Array.from({ length }, () => {
    const name = faker.person.fullName();
    const login = faker.internet
      .userName({
        firstName: name.split(" ")[0],
        lastName: name.split(" ")[1],
      })
      .toLowerCase();

    const role = faker.helpers.arrayElement(
      Object.values(schema.ZodWorkerRole.Enum).filter(
        (role) => role !== schema.ZodWorkerRole.Enum.SYSTEM_ADMIN,
      ),
    );

    let restaurantId: string | null = null;

    if (role !== schema.ZodWorkerRole.Enum.CHIEF_ADMIN) {
      restaurantId = faker.helpers.arrayElement(restaurants.map((r) => r.id));
    }

    return {
      name,
      login,
      passwordHash,
      role,
      onlineAt: faker.date.recent(),
      hiredAt: faker.date.past(),
      isBlocked: false,
      restaurantId,
    } as typeof schema.workers.$inferInsert;
  });
};

export default async function seedWorkers(count: number) {
  console.log("Seeding workers...");
  const workers = await mockWorkers(count);

  await DatabaseHelper.pg.insert(schema.workers).values(workers);
}

export const createSystemAdmin = async () => {
  console.log("Creating system admin...");
  return await DatabaseHelper.pg.insert(schema.workers).values({
    login: "admin",
    role: schema.ZodWorkerRole.Enum.SYSTEM_ADMIN,
    passwordHash: await argon2.hash(TEST_PASSWORD),
  });
};
