/* eslint-disable @typescript-eslint/no-unused-vars */
import { faker } from "@faker-js/faker";
import dotenv from "dotenv";
import chunker from "utils/seed/chunker";
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

const CHUNK_SIZE = 4000;

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
  const restaurantHours = restaurantIds.flatMap((restaurantId) =>
    workingHours.map((hours) => ({
      ...hours,
      restaurantId,
    })),
  );

  const restaurantHoursChunks = chunker(restaurantHours, CHUNK_SIZE);

  for (const chunk of restaurantHoursChunks) {
    await db.insert(schema.restaurantHours).values(chunk);
  }

  // Insert workshops for each restaurant
  const restaurantWorkshops = restaurantIds.flatMap((restaurantId) =>
    mockRestaurantWorkshops({
      restaurantId,
      count: 5,
    }),
  );

  const restaurantWorkshopsChunks = chunker(restaurantWorkshops, CHUNK_SIZE);

  for (const chunk of restaurantWorkshopsChunks) {
    await db.insert(schema.restaurantWorkshops).values(chunk);
  }

  const paymentMethods = ["Cash", "Card", "Online transfer"];

  // Payment methods for each restaurant
  const restaurantPaymentMethods = restaurantIds.flatMap((restaurantId) =>
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
  );

  const restaurantPaymentMethodsChunks = chunker(
    restaurantPaymentMethods,
    CHUNK_SIZE,
  );

  for (const chunk of restaurantPaymentMethodsChunks) {
    await db.insert(schema.paymentMethods).values(chunk);
  }

  // Dish Modifiers
  const restaurantDishModifiers = restaurantIds.flatMap((restaurantId) =>
    mockRestaurantDishModifiers({
      restaurantId,
      count: 10,
    }),
  );

  const restaurantDishModifiersChunks = chunker(
    restaurantDishModifiers,
    CHUNK_SIZE,
  );

  for (const chunk of restaurantDishModifiersChunks) {
    await db.insert(schema.dishModifiers).values(chunk);
  }
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

    const dishesMenusToRestaurants = restaurantIds.map((restaurantId) => ({
      dishesMenuId: dishMenu.id,
      restaurantId,
    }));

    const dishesMenusToRestaurantsChunks = chunker(
      dishesMenusToRestaurants,
      CHUNK_SIZE,
    );

    for (const chunk of dishesMenusToRestaurantsChunks) {
      await db.insert(schema.dishesMenusToRestaurants).values(chunk);
    }
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

  const dishesToRestaurants = dishes.flatMap((dish) => {
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
  });

  const dishesToRestaurantsChunks = chunker(dishesToRestaurants, CHUNK_SIZE);

  for (const chunk of dishesToRestaurantsChunks) {
    await db.insert(schema.dishesToRestaurants).values(chunk);
  }
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

  const dishesToWorkshops = dishesToRestaurants.flatMap((dishToRestaurant) => {
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
  });

  const dishesToWorkshopsChunks = chunker(dishesToWorkshops, CHUNK_SIZE);

  for (const chunk of dishesToWorkshopsChunks) {
    await db.insert(schema.dishesToWorkshops).values(chunk);
  }
}

async function processBatchedMockData<T>({
  totalCount,
  batchSize = CHUNK_SIZE,
  createMockBatch,
  insertBatch,
}: {
  totalCount: number;
  batchSize?: number;
  createMockBatch: (count: number) => Promise<T[]>;
  insertBatch: (items: T[]) => Promise<void>;
}) {
  const batchCount = Math.ceil(totalCount / batchSize);

  for (let i = 0; i < batchCount; i++) {
    // For the last batch, only create the remaining items
    const currentBatchSize = Math.min(batchSize, totalCount - i * batchSize);
    if (currentBatchSize <= 0) break;

    // Create a batch of mock data
    const mockBatch = await createMockBatch(currentBatchSize);

    // Insert the batch
    await insertBatch(mockBatch);
  }
}

async function main() {
  const config = seedConfigVariants["insane"];

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
  const workersChunks = chunker(
    [systemAdmin, ...workers, ...restaurantOwners],
    CHUNK_SIZE,
  );

  for (const chunk of workersChunks) {
    await db.insert(schema.workers).values(chunk);
  }

  // Then time for restaurants
  const restaurantsChunks = chunker(restaurants, CHUNK_SIZE);

  for (const chunk of restaurantsChunks) {
    await db.insert(schema.restaurants).values(chunk);
  }

  // Create restaurant things
  await populateRestaurantsInfo(restaurants.map((r) => r.id));

  // Assign workers to restaurants
  const workersToRestaurantsChunks = chunker(
    workers.map((worker) => {
      const restaurant = faker.helpers.arrayElement(restaurants);

      return {
        workerId: worker.id,
        restaurantId: restaurant.id,
      };
    }),
    CHUNK_SIZE,
  );

  for (const chunk of workersToRestaurantsChunks) {
    await db.insert(schema.workersToRestaurants).values(chunk);
  }

  const dishMenus = mockDishMenus({
    ownerIds: restaurantOwners.map((owner) => owner.id),
    count: config.dishMenusPerOwner,
  });

  // Create dish menus
  const dishMenusChunks = chunker(dishMenus, CHUNK_SIZE);

  for (const chunk of dishMenusChunks) {
    await db.insert(schema.dishesMenus).values(chunk);
  }

  // Assign restaurants to dish menus
  await assignRestaurantsToDishMenus();

  const dishes = dishMenus.flatMap((dishMenu) =>
    mockDishes({
      menuId: dishMenu.id,
      count: config.dishesPerMenu,
    }),
  );

  // Create dishes
  const dishesChunks = chunker(dishes, CHUNK_SIZE);

  for (const chunk of dishesChunks) {
    await db.insert(schema.dishes).values(chunk);
  }

  await populateDishesPricelist();
  await populateDishesWorkshopsRelations();

  // Process just created orders in batches
  await processBatchedMockData({
    totalCount: config.orders.justCreated,
    createMockBatch: async (count) => await mockJustCreatedOrders({ count }),
    insertBatch: async (orders) => {
      const chunks = chunker(orders, CHUNK_SIZE);
      const historyRecords = orders.map(
        (order) =>
          ({
            orderId: order.id,
            type: "created",
          }) as typeof schema.orderHistoryRecords.$inferInsert,
      );

      const historyChunks = chunker(historyRecords, CHUNK_SIZE);

      await Promise.all([
        ...chunks.map(async (chunk) => {
          return db.insert(schema.orders).values(chunk);
        }),
        ...historyChunks.map(async (chunk) => {
          return db.insert(schema.orderHistoryRecords).values(chunk);
        }),
      ]);
    },
  });

  // Process just created orders with dishes in batches
  await processBatchedMockData({
    totalCount: config.orders.justCreatedWithDishes,
    createMockBatch: async (count) =>
      await mockJustCreatedOrdersWithDishes({ count }),
    insertBatch: async (orders) => {
      const chunks = chunker(orders, CHUNK_SIZE);
      const historyRecords = orders.map(
        (order) =>
          ({
            orderId: order.id,
            type: "created",
          }) as typeof schema.orderHistoryRecords.$inferInsert,
      );

      const historyChunks = chunker(historyRecords, CHUNK_SIZE);

      const orderDishes = orders.flatMap(({ orderDishes, ...order }) =>
        orderDishes.map((dish) => ({ ...dish })),
      );

      const dishesChunks = chunker(orderDishes, CHUNK_SIZE);

      await Promise.all([
        ...chunks.map(async (chunk) => {
          return db.insert(schema.orders).values(chunk);
        }),
        ...historyChunks.map(async (chunk) => {
          return db.insert(schema.orderHistoryRecords).values(chunk);
        }),
        ...dishesChunks.map(async (chunk) => {
          return db.insert(schema.orderDishes).values(chunk);
        }),
      ]);

      // for (const chunk of chunks) {
      //   await db.insert(schema.orders).values(chunk);
      // }

      // for (const chunk of historyChunks) {
      //   await db.insert(schema.orderHistoryRecords).values(chunk);
      // }
    },
  });

  // Process sent to kitchen orders in batches
  await processBatchedMockData({
    totalCount: config.orders.sentToKitchen,
    createMockBatch: async (count) => await mockSentToKitchenOrders({ count }),
    insertBatch: async (orders) => {
      const chunks = chunker(orders, CHUNK_SIZE);

      // for (const chunk of chunks) {
      //   await db.insert(schema.orders).values(chunk);
      // }

      // Created history records
      const createdHistoryRecords = orders.map(
        (order) =>
          ({
            orderId: order.id,
            type: "created",
          }) as typeof schema.orderHistoryRecords.$inferInsert,
      );

      const createdHistoryChunks = chunker(createdHistoryRecords, CHUNK_SIZE);

      // for (const chunk of createdHistoryChunks) {
      //   await db.insert(schema.orderHistoryRecords).values(chunk);
      // }

      // Sent to kitchen history records
      const sentToKitchenHistoryRecords = orders.map(
        (order) =>
          ({
            orderId: order.id,
            type: "sent_to_kitchen",
          }) as typeof schema.orderHistoryRecords.$inferInsert,
      );

      const sentToKitchenHistoryChunks = chunker(
        sentToKitchenHistoryRecords,
        CHUNK_SIZE,
      );

      // for (const chunk of sentToKitchenHistoryChunks) {
      //   await db.insert(schema.orderHistoryRecords).values(chunk);
      // }

      // Order dishes
      const orderDishes = orders.flatMap(({ orderDishes, ...order }) =>
        orderDishes.map((dish) => ({ ...dish })),
      );

      const dishesChunks = chunker(orderDishes, CHUNK_SIZE);

      await Promise.all([
        ...chunks.map(async (chunk) => {
          return db.insert(schema.orders).values(chunk);
        }),
        ...dishesChunks.map(async (chunk) => {
          return db.insert(schema.orderDishes).values(chunk);
        }),
        ...createdHistoryChunks.map(async (chunk) => {
          return db.insert(schema.orderHistoryRecords).values(chunk);
        }),
        ...sentToKitchenHistoryChunks.map(async (chunk) => {
          return db.insert(schema.orderHistoryRecords).values(chunk);
        }),
      ]);
      // for (const chunk of dishesChunks) {
      //   await db.insert(schema.orderDishes).values(chunk);
      // }
    },
  });
}

main();
