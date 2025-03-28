/* eslint-disable @typescript-eslint/no-unused-vars */
import { faker } from "@faker-js/faker";
import dotenv from "dotenv";
import { seedConfigVariants } from "utils/seed/config";
import db, { schema } from "utils/seed/db";
import mockDishes, { mockDishMenus } from "utils/seed/mocks/dishes";
import mockJustCreatedOrders, {
  mockJustCreatedOrdersWithDishes,
  mockSentToKitchenOrders,
} from "utils/seed/mocks/orders";
import mockRestaurants, {
  mockRestaurantDishModifiers,
  mockRestaurantWorkshops,
} from "utils/seed/mocks/restaurants";
import mockWorkers from "utils/seed/mocks/workers";

dotenv.config({
  path: "utils/seed/.env",
});

async function populateRestaurantsInfo(restaurantIds: string[]) {
  const workingHours = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ].map(
    (dayOfWeek) =>
      ({
        dayOfWeek,
        closingTime: "23:00",
        isEnabled: true,
        openingTime: "10:00",
      }) as typeof schema.restaurantHours.$inferInsert,
  );

  // Insert working hours for each restaurant
  await db.insert(schema.restaurantHours).values(
    restaurantIds.flatMap((restaurantId) =>
      workingHours.map((hours) => ({
        ...hours,
        restaurantId,
      })),
    ),
  );

  // Insert workshops for each restaurant
  await db.insert(schema.restaurantWorkshops).values(
    restaurantIds.flatMap((restaurantId) =>
      mockRestaurantWorkshops({
        restaurantId,
        count: 5,
      }),
    ),
  );

  const paymentMethods = ["Cash", "Card", "Online transfer"];

  // Payment methods for each restaurant
  await db.insert(schema.paymentMethods).values(
    restaurantIds.flatMap((restaurantId) =>
      paymentMethods.map(
        (name) =>
          ({
            restaurantId,
            icon: "CARD",
            name,
            type: "CUSTOM",
            isActive: true,
          }) satisfies typeof schema.paymentMethods.$inferInsert,
      ),
    ),
  );

  // Dish Modifiers
  await db.insert(schema.dishModifiers).values(
    restaurantIds.flatMap((restaurantId) =>
      mockRestaurantDishModifiers({
        restaurantId,
        count: 10,
      }),
    ),
  );
}

async function assignRestaurantsToDishMenus() {
  const dishMenus = await db.query.dishesMenus.findMany({
    columns: {
      id: true,
      ownerId: true,
    },
  });

  const restaurants = await db.query.restaurants.findMany({
    columns: {
      id: true,
      ownerId: true,
    },
  });

  const ownerIdToRestaurantIdsMap = new Map<string, string[]>();

  for (const restaurant of restaurants) {
    if (!restaurant.ownerId) {
      continue;
    }

    const ownerId = restaurant.ownerId;
    const restaurantId = restaurant.id;

    if (!ownerIdToRestaurantIdsMap.has(ownerId)) {
      ownerIdToRestaurantIdsMap.set(ownerId, []);
    }

    ownerIdToRestaurantIdsMap.get(ownerId)?.push(restaurantId);
  }

  for (const dishMenu of dishMenus) {
    const restaurantIds = ownerIdToRestaurantIdsMap.get(dishMenu.ownerId);

    if (!restaurantIds) {
      continue;
    }

    await db.insert(schema.dishesMenusToRestaurants).values(
      restaurantIds.map((restaurantId) => ({
        dishesMenuId: dishMenu.id,
        restaurantId,
      })),
    );
  }
}

async function populateDishesPricelist() {
  const dishes = await db.query.dishes.findMany({
    columns: {
      id: true,
      menuId: true,
    },
    with: {
      menu: {
        columns: {},
        with: {
          dishesMenusToRestaurants: {
            columns: {
              restaurantId: true,
            },
            with: {
              restaurant: {
                columns: {
                  currency: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Populate dishes to restaurants
  await db.insert(schema.dishesToRestaurants).values(
    dishes.flatMap((dish) => {
      const price = faker.number.float({ min: 3, max: 22 });

      return (dish.menu?.dishesMenusToRestaurants || []).map((menu) => {
        return {
          dishId: String(dish.id),
          restaurantId: String(menu.restaurantId),
          isInStopList: false,
          currency: menu.restaurant.currency,
          price: price.toString(),
        } as typeof schema.dishesToRestaurants.$inferInsert;
      });
    }),
  );
}

async function populateDishesWorkshopsRelations() {
  const dishesToRestaurants = await db.query.dishesToRestaurants.findMany({
    columns: {
      dishId: true,
      restaurantId: true,
    },
  });

  const restaurantWorkshops = await db.query.restaurantWorkshops.findMany({
    columns: {
      id: true,
      restaurantId: true,
    },
  });

  const restaurantIdToWorkshopIdsMap = restaurantWorkshops.reduce(
    (acc, workshop) => {
      if (!acc?.[workshop.restaurantId]) {
        acc[workshop.restaurantId] = [];
      }

      acc[workshop.restaurantId].push(workshop.id);

      return acc;
    },
    {} as Record<string, string[]>,
  );

  // Populate dishes to workshops
  await db.insert(schema.dishesToWorkshops).values(
    dishesToRestaurants.flatMap((dishToRestaurant) => {
      const allWorkshopIds =
        restaurantIdToWorkshopIdsMap?.[dishToRestaurant.restaurantId] || [];

      const workshopIds = faker.helpers.arrayElements(allWorkshopIds || [], {
        min: 1,
        max: allWorkshopIds.length,
      });

      if (workshopIds.length === 0) {
        return [];
      }

      return (workshopIds || []).map(
        (workshopId) =>
          ({
            dishId: dishToRestaurant.dishId,
            workshopId,
          }) satisfies typeof schema.dishesToWorkshops.$inferInsert,
      );
    }),
  );
}

async function main() {
  const config = seedConfigVariants["mini"];

  const restaurantOwners = await mockWorkers({
    count: config.restaurantOwners,
    role: "OWNER",
  });

  const systemAdmin = {
    ...(
      await mockWorkers({
        count: 1,
        role: "SYSTEM_ADMIN",
      })
    )[0],
    login: "admin",
  };

  const workers = await mockWorkers({
    count: config.workers,
  });

  const restaurants = await mockRestaurants({
    count: config.restaurants,
    ownerIds: restaurantOwners.map((owner) => owner.id),
  });

  // Insert workers first
  await db
    .insert(schema.workers)
    .values([systemAdmin, ...workers, ...restaurantOwners]);

  // Then time for restaurants
  await db.insert(schema.restaurants).values(restaurants);

  // Create restaurant things
  await populateRestaurantsInfo(restaurants.map((r) => r.id));

  // Assign workers to restaurants
  await db.insert(schema.workersToRestaurants).values(
    workers.map((worker) => {
      const restaurant = faker.helpers.arrayElement(restaurants);

      return {
        workerId: worker.id,
        restaurantId: restaurant.id,
      };
    }),
  );

  const dishMenus = mockDishMenus({
    ownerIds: restaurantOwners.map((owner) => owner.id),
    count: config.dishMenusPerOwner,
  });

  // Create dish menus
  await db.insert(schema.dishesMenus).values(dishMenus);

  // Assign restaurants to dish menus
  await assignRestaurantsToDishMenus();

  const dishes = dishMenus.flatMap((dishMenu) =>
    mockDishes({
      menuId: dishMenu.id,
      count: config.dishesPerMenu,
    }),
  );

  // Create dishes
  await db.insert(schema.dishes).values(dishes);

  await populateDishesPricelist();
  await populateDishesWorkshopsRelations();

  // Just created orders
  const justCreatedOrders = await mockJustCreatedOrders({
    count: config.orders.justCreated,
  });

  await db.insert(schema.orders).values(justCreatedOrders);
  await db.insert(schema.orderHistoryRecords).values(
    justCreatedOrders.map(
      (order) =>
        ({
          orderId: order.id,
          type: "created",
        }) as typeof schema.orderHistoryRecords.$inferInsert,
    ),
  );

  // Just created orders with dishes
  const justCreatedOrdersWithDishes = await mockJustCreatedOrdersWithDishes({
    count: config.orders.justCreatedWithDishes,
  });

  await db
    .insert(schema.orders)
    .values(
      justCreatedOrdersWithDishes.map(({ orderDishes, ...order }) => order),
    );

  await Promise.all([
    // History
    db.insert(schema.orderHistoryRecords).values(
      justCreatedOrdersWithDishes.flatMap(
        (order) =>
          ({
            orderId: order.id,
            type: "created",
          }) as typeof schema.orderHistoryRecords.$inferInsert,
      ),
    ),
    // Order dishes
    db.insert(schema.orderDishes).values(
      justCreatedOrdersWithDishes.flatMap(({ orderDishes, ...order }) =>
        orderDishes.map((dish) => ({
          ...dish,
        })),
      ),
    ),
  ]);

  // Sent to kitchen orders
  const sentToKitchenOrders = await mockSentToKitchenOrders({
    count: config.orders.sentToKitchen,
  });

  await db
    .insert(schema.orders)
    .values(sentToKitchenOrders.map(({ orderDishes, ...order }) => order));

  await Promise.all([
    db.insert(schema.orderDishes).values(
      sentToKitchenOrders.flatMap(({ orderDishes, ...order }) =>
        orderDishes.map((dish) => ({
          ...dish,
        })),
      ),
    ),
    db.insert(schema.orderHistoryRecords).values(
      sentToKitchenOrders.flatMap(
        (order) =>
          ({
            orderId: order.id,
            type: "created",
          }) as typeof schema.orderHistoryRecords.$inferInsert,
      ),
    ),
    db.insert(schema.orderHistoryRecords).values(
      sentToKitchenOrders.flatMap(
        (order) =>
          ({
            orderId: order.id,
            type: "sent_to_kitchen",
          }) as typeof schema.orderHistoryRecords.$inferInsert,
      ),
    ),
  ]);
}

main();
