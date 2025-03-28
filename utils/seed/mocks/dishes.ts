import { faker } from "@faker-js/faker";
import { schema } from "utils/seed/db";
import { v4 as uuidv4 } from "uuid";

export function mockDishMenus(opts: { ownerIds: string[]; count: number }) {
  const { count, ownerIds } = opts;

  return ownerIds
    .map((ownerId) =>
      Array.from(
        { length: count },
        () =>
          ({
            id: uuidv4(),
            name: faker.commerce.productName(),
            ownerId,
          }) satisfies typeof schema.dishesMenus.$inferInsert,
      ),
    )
    .flat();
}

export default function mockDishes(opts: { menuId: string; count: number }) {
  const { count, menuId } = opts;

  return Array.from(
    { length: count },
    () =>
      ({
        id: uuidv4(),
        name: faker.commerce.productName(),
        amountPerItem: faker.number.int({ min: 1, max: 10 }),
        cookingTimeInMin: faker.number.int({ min: 1, max: 100 }),
        printLabelEveryItem: faker.number.int({ min: 1, max: 10 }),
        isPublishedAtSite: true,
        isPublishedInApp: true,
        isLabelPrintingEnabled: faker.datatype.boolean(),
        weight: faker.number.int({ min: 1, max: 1000 }),
        weightMeasure: "grams",
        note: faker.lorem.sentence(),
        menuId,
      }) satisfies typeof schema.dishes.$inferInsert,
  );
}
