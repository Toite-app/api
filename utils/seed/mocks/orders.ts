import { faker } from "@faker-js/faker";
import db, { schema } from "utils/seed/db";
import { v4 as uuidv4 } from "uuid";

export type Order = typeof schema.orders.$inferSelect;

export default async function mockJustCreatedOrders(opts: { count: number }) {
  const { count } = opts;

  const restaurants = await db.query.restaurants.findMany({
    columns: {
      id: true,
      currency: true,
    },
    with: {
      paymentMethods: {
        where: (paymentMethods, { eq }) => eq(paymentMethods.type, "CUSTOM"),
        columns: {
          id: true,
        },
      },
    },
  });

  const lastOrderNumberBroneering =
    await db.query.orderNumberBroneering.findFirst({
      columns: {
        number: true,
      },
      orderBy: (orderNumberBroneering, { desc }) => [
        desc(orderNumberBroneering.number),
      ],
    });

  const lastOrderNumber = lastOrderNumberBroneering?.number || "0";

  await db.insert(schema.orderNumberBroneering).values(
    Array.from({ length: count }, (_, i) => ({
      number: String(Number(lastOrderNumber) + i + 1),
    })),
  );

  return Array.from({ length: count }, (_, i) => {
    const restaurant = faker.helpers.arrayElement(restaurants);

    const orderNumber = String(Number(lastOrderNumber) + i + 1);

    const from = faker.helpers.arrayElement([
      "app",
      "internal",
      "website",
    ] as Order["from"][]);

    const type = faker.helpers.arrayElement([
      "hall",
      "banquet",
      "takeaway",
      "delivery",
    ] as Order["type"][]);

    const paymentMethodId = faker.helpers.arrayElement(
      restaurant.paymentMethods.map((paymentMethod) => paymentMethod.id),
    );

    return {
      id: uuidv4(),
      number: orderNumber,
      restaurantId: restaurant.id,
      currency: restaurant.currency,
      from,
      status: "pending",
      type,
      guestName: faker.person.firstName(),
      note: faker.lorem.sentence(),
      paymentMethodId,
      guestsAmount: faker.number.int({ min: 1, max: 10 }),
      ...((type === "banquet" || type === "hall") && {
        tableNumber: faker.number.int({ min: 1, max: 100000 }).toString(),
      }),
      createdAt: faker.date.recent(),
    } satisfies typeof schema.orders.$inferInsert;
  });
}

export async function mockJustCreatedOrdersWithDishes(opts: { count: number }) {
  const { count } = opts;

  const dishesMenusToRestaurants =
    await db.query.dishesMenusToRestaurants.findMany({
      columns: {
        dishesMenuId: true,
        restaurantId: true,
      },
      with: {
        dishesMenu: {
          columns: {},
          with: {
            dishes: {
              columns: {
                id: true,
                name: true,
              },
              with: {
                dishesToRestaurants: {
                  columns: {
                    price: true,
                    dishId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

  const restaurantIdToMenu = new Map(
    dishesMenusToRestaurants.map((dm) => [dm.restaurantId, dm.dishesMenu]),
  );

  const justCreatedOrders = await mockJustCreatedOrders({ count });

  return justCreatedOrders.map((order) => {
    const dishesMenu = restaurantIdToMenu.get(order.restaurantId);

    const someDishes = faker.helpers.arrayElements(dishesMenu?.dishes || [], {
      min: 3,
      max: 11,
    });

    const orderDishes = someDishes
      .map((dish) => {
        const price = dish.dishesToRestaurants?.[0]?.price;

        if (!price) return null;

        return {
          dishId: dish.id,
          name: dish.name,
          orderId: order.id,
          quantity: faker.number.int({ min: 1, max: 10 }),
          status: "pending",
          price,

          finalPrice: price,
        } satisfies typeof schema.orderDishes.$inferInsert;
      })
      .filter(Boolean) as (typeof schema.orderDishes.$inferInsert)[];

    const orderDishesPrices = orderDishes.reduce(
      (acc, dish) => ({
        price: acc.price + Number(dish.price) * dish.quantity,
        finalPrice: acc.finalPrice + Number(dish.finalPrice) * dish.quantity,
      }),
      { price: 0, finalPrice: 0 },
    );

    return {
      ...order,
      total: orderDishesPrices.finalPrice.toString(),
      subtotal: orderDishesPrices.price.toString(),
      orderDishes,
    } satisfies typeof schema.orders.$inferInsert & {
      orderDishes: (typeof schema.orderDishes.$inferInsert)[];
    };
  });
}
