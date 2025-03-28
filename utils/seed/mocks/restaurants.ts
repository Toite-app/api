import { faker } from "@faker-js/faker";
import { schema } from "utils/seed/db";
import { v4 as uuidv4 } from "uuid";

export default async function mockRestaurants(opts: {
  ownerIds: string[];
  count: number;
}) {
  const { count, ownerIds } = opts;

  return Array.from(
    { length: count },
    () =>
      ({
        id: uuidv4(),
        name: `${faker.company.name()}`,
        legalEntity: `${faker.company.name()}, ${faker.string.numeric(8)}`,
        address: `${faker.location.streetAddress()}`,
        latitude: `${faker.location.latitude()}`,
        longitude: `${faker.location.longitude()}`,
        currency: "EUR",
        timezone: "Europe/Tallinn",
        isEnabled: true,
        isClosedForever: false,
        ...(ownerIds.length > 0 && {
          ownerId: faker.helpers.arrayElement(ownerIds),
        }),
      }) satisfies typeof schema.restaurants.$inferInsert,
  );
}

export function mockRestaurantPaymentMethods(opts: {
  restaurantId: string;
  count: number;
}) {
  const { count, restaurantId } = opts;

  return Array.from(
    { length: count },
    () =>
      ({
        id: uuidv4(),
        icon: "CARD",
        name: faker.commerce.department(),
        type: "CUSTOM",
        isActive: true,
        restaurantId,
      }) satisfies typeof schema.paymentMethods.$inferInsert,
  );
}

export function mockRestaurantWorkshops(opts: {
  restaurantId: string;
  count: number;
}) {
  const { count, restaurantId } = opts;

  return Array.from(
    { length: count },
    () =>
      ({
        id: uuidv4(),
        restaurantId,
        name: faker.commerce.department(),
        isEnabled: true,
        isLabelPrintingEnabled: faker.datatype.boolean(),
      }) satisfies typeof schema.restaurantWorkshops.$inferInsert,
  );
}

export function mockRestaurantDishModifiers(opts: {
  restaurantId: string;
  count: number;
}) {
  const { count, restaurantId } = opts;

  return Array.from(
    { length: count },
    () =>
      ({
        id: uuidv4(),
        restaurantId,
        name: faker.commerce.department(),
        isActive: true,
      }) satisfies typeof schema.dishModifiers.$inferInsert,
  );
}
