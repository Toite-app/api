import { faker } from "@faker-js/faker";
import { DatabaseHelper, schema } from "test/helpers/database";

const mockDishes = async (
  count: number,
): Promise<(typeof schema.dishes.$inferInsert)[]> => {
  return Array.from({ length: count }, () => {
    return {
      name: faker.commerce.productName(),
      weight: faker.number.int({ min: 50, max: 200 }),
      weightMeasure: "grams",
      cookingTimeInMin: faker.number.int({ min: 10, max: 60 }),
      note: faker.lorem.sentence(),
      isPublishedAtSite: true,
      isPublishedInApp: true,
    } as typeof schema.dishes.$inferInsert;
  });
};

export default async function seedDishes(count: number) {
  console.log("Seeding dishes...");
  const dishes = await mockDishes(count);
  await DatabaseHelper.pg.insert(schema.dishes).values(dishes);
}
