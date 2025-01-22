import { faker } from "@faker-js/faker";
import { DatabaseHelper, schema } from "test/helpers/database";
import { v4 as uuidv4 } from "uuid";

const MAX_DISHES_PER_ORDER = 10;
const MIN_DISHES_PER_ORDER = 1;

const mockOrders = async (count: number) => {
  const restaurants = await DatabaseHelper.pg.select().from(schema.restaurants);
  const guests = await DatabaseHelper.pg.select().from(schema.guests);
  const dishes = await DatabaseHelper.pg.select().from(schema.dishes);

  let number = 0;

  return Array.from({ length: count }, () => {
    number++;

    const orderId = uuidv4();
    const isWithGuestPhone = faker.datatype.boolean();

    const isWithGuestId = faker.datatype.boolean();
    const guest =
      guests.length > 0 && isWithGuestId
        ? faker.helpers.arrayElement(guests)
        : null;

    const isWithRestaurant = faker.datatype.boolean();
    const restaurant =
      restaurants.length > 0 && isWithRestaurant
        ? faker.helpers.arrayElement(restaurants)
        : null;

    const type = faker.helpers.arrayElement([
      "hall",
      "banquet",
      "takeaway",
      "delivery",
    ]);

    const status = faker.helpers.arrayElement([
      "pending",
      ...(!!restaurant
        ? [
            "cooking",
            "ready",
            "paid",
            "completed",
            ...(type === "hall" || type === "banquet" ? ["delivering"] : []),
          ]
        : []),
      "cancelled",
    ]);

    const orderDishes = Array.from(
      {
        length: faker.number.int({
          min: MIN_DISHES_PER_ORDER,
          max: MAX_DISHES_PER_ORDER,
        }),
      },
      () => {
        const dish = faker.helpers.arrayElement(dishes);
        const price = faker.number.float({ min: 1, max: 30 });

        let dishStatus = "pending";

        if (status === "cooking") {
          dishStatus = faker.helpers.arrayElement(["cooking", "ready"]);
        }

        if (status === "ready") {
          dishStatus = faker.helpers.arrayElement(["ready", "completed"]);
        }

        if (
          status === "delivering" ||
          status === "paid" ||
          status === "completed"
        ) {
          dishStatus = "completed";
        }

        return {
          name: dish.name,
          status: dishStatus,
          dishId: dish.id,
          orderId: orderId,
          quantity: faker.number.int({
            min: 1,
            max: 10,
          }),
          price: price.toString(),
          finalPrice: price.toString(),
        } as typeof schema.orderDishes.$inferInsert;
      },
    );

    return {
      order: {
        id: orderId,
        from: faker.helpers.arrayElement(["app", "website", "internal"]),
        currency: "EUR",
        number: number.toString(),
        type,
        status,
        ...(type === "hall" || type === "banquet"
          ? {
              tableNumber: `${faker.number.int({ min: 1, max: 10 })}.${faker.number.int({ min: 1, max: 10 })}`,
            }
          : {}),
        guestName: guest?.name,
        guestPhone: guest?.phone
          ? guest.phone
          : isWithGuestPhone
            ? `+372${faker.string.numeric({ length: { min: 8, max: 8 } })}`
            : null,
        guestsAmount: faker.number.int({ min: 1, max: 10 }),
        note: faker.lorem.sentence(),
        restaurantId: restaurant?.id,
        subtotal: orderDishes
          .reduce((acc, dish) => acc + Number(dish.price), 0)
          .toString(),
        total: orderDishes
          .reduce((acc, dish) => acc + Number(dish.finalPrice), 0)
          .toString(),
        createdAt: faker.date.recent(),
        updatedAt: faker.date.recent(),
        isArchived: false,
        isRemoved: false,
      } as typeof schema.orders.$inferInsert,
      orderDishes,
    };
  });
};

export default async function seedOrders({
  active,
  archived,
  removed,
}: {
  active: number;
  archived: number;
  removed: number;
}) {
  console.log("Seeding orders...");

  const totalCount = active + archived + removed;
  const orders = await mockOrders(totalCount);

  orders.forEach((order, index) => {
    if (index < active) {
      return;
    }
    if (index < active + archived) {
      order.order.isArchived = true;
      order.order.removedAt = null;
    } else {
      order.order.isRemoved = true;
      order.order.removedAt = faker.date.recent();
    }
  });

  const perOne = 1000;
  const stagedOrders = [] as (typeof orders)[];

  for (let i = 0; i < orders.length; i += perOne) {
    const ordersToInsert = orders.slice(i, i + perOne);
    stagedOrders.push(ordersToInsert);
  }

  for (const ordersToInsert of stagedOrders) {
    await DatabaseHelper.pg
      .insert(schema.orders)
      .values(ordersToInsert.map((order) => order.order));

    await DatabaseHelper.pg
      .insert(schema.orderDishes)
      .values(ordersToInsert.flatMap((order) => order.orderDishes));
  }
}

// await DatabaseHelper.pg
//   .insert(schema.orderDishes)
//   .values(orders.flatMap((order) => order.orderDishes));
