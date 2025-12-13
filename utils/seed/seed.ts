import { faker } from "@faker-js/faker";
import argon2 from "argon2";
import { WorkshiftPaymentType } from "src/@base/drizzle/schema/workshift-enums";

import { SEED_CONFIG } from "./config";
import { CuisineType } from "./data/cuisines";
import db, {
  closePool,
  ensureDatabaseEmpty,
  runMigrations,
  schema,
} from "./db";
import { buildDiscountLookupMap, mockDiscounts } from "./mocks/discounts";
import {
  DishMenuWithCuisine,
  DishWithCategory,
  mockDishCategories,
  mockDishes,
  mockDishesToCategories,
  mockDishMenus,
  mockDishPrices,
  mockDishWorkshops,
  mockMenuToRestaurants,
} from "./mocks/dishes";
import { mockGuests, toGuestInfoArray } from "./mocks/guests";
import {
  DishWithPrice as DishWithPriceType,
  mockJustCreatedOrders,
  mockOrderHistoryRecords,
  mockOrdersWithDishes,
  mockSentToKitchenOrders,
  type RestaurantWithPaymentMethods,
} from "./mocks/orders";
import {
  mockDishModifiers,
  mockPaymentMethods,
  mockRestaurantHours,
  mockRestaurants,
  mockRestaurantWorkshops,
  RestaurantWithCuisine,
} from "./mocks/restaurants";
import { mockSystemAdmin, mockWorkers } from "./mocks/workers";
import {
  mockWorkshiftPaymentCategories,
  mockWorkshiftPayments,
  mockWorkshifts,
} from "./mocks/workshifts";
import { chunker, log, logError, withTiming } from "./utils";

// Set deterministic faker seed for reproducible data
faker.seed(42);

const CHUNK_SIZE = 1000;

// Helper to insert data in chunks with parallel execution
async function insertChunked<T extends Record<string, unknown>>(
  table: Parameters<typeof db.insert>[0],
  data: T[],
): Promise<void> {
  const chunks = chunker(data, CHUNK_SIZE);
  await Promise.all(
    chunks.map((chunk) => db.insert(table).values(chunk as T[])),
  );
}

async function main(): Promise<void> {
  const startTime = performance.now();
  log(`Starting with deterministic seed 42`);

  // Step 1: Run migrations
  await withTiming("Running migrations", runMigrations);

  // Step 2: Ensure database is empty
  await ensureDatabaseEmpty();

  // Step 3: Pre-compute password hash once
  log("Computing password hash...");
  const passwordHash = await argon2.hash("123456");

  // ============================================================
  // PHASE 0: Generate all mock data in memory
  // ============================================================
  await withTiming("Generated all mock data", async () => {
    log("Generating mock data...");

    // Generate workers
    const restaurantOwners = mockWorkers({
      count: SEED_CONFIG.restaurantOwners,
      role: "OWNER",
      passwordHash,
    });

    const systemAdmin = mockSystemAdmin(passwordHash);

    const regularWorkers = mockWorkers({
      count: SEED_CONFIG.workers,
      passwordHash,
    });

    const allWorkers = [systemAdmin, ...restaurantOwners, ...regularWorkers];
    const ownerIds = restaurantOwners.map((o) => o.id!);

    // Generate guests
    const allGuests = mockGuests({ count: SEED_CONFIG.guests });
    const guestInfoArray = toGuestInfoArray(allGuests);

    // Generate restaurants (now with cuisine types)
    const restaurants: RestaurantWithCuisine[] = mockRestaurants({
      count: SEED_CONFIG.restaurants,
      ownerIds,
    });
    const restaurantIds = restaurants.map((r) => r.id!);

    // Generate restaurant-related data
    const restaurantHours = mockRestaurantHours(restaurantIds);
    const paymentMethods = mockPaymentMethods(restaurantIds);

    const allWorkshops = restaurantIds.flatMap((restaurantId) =>
      mockRestaurantWorkshops({
        restaurantId,
        count: SEED_CONFIG.workshopsPerRestaurant,
      }),
    );

    const allDishModifiers = restaurantIds.flatMap((restaurantId) =>
      mockDishModifiers({
        restaurantId,
        count: SEED_CONFIG.dishModifiersPerRestaurant,
      }),
    );

    const allWorkshiftPaymentCategories = restaurantIds.flatMap(
      (restaurantId) =>
        mockWorkshiftPaymentCategories({
          restaurantId,
          minPerType: SEED_CONFIG.workshiftPaymentCategories.perTypeMin,
          maxPerType: SEED_CONFIG.workshiftPaymentCategories.perTypeMax,
          maxChildrenPerParent:
            SEED_CONFIG.workshiftPaymentCategories.maxChildrenPerParent,
        }),
    );

    // Build restaurant -> modifiers map (for order dish modifiers)
    const restaurantModifiersMap = new Map<string, string[]>();
    for (const modifier of allDishModifiers) {
      const existing = restaurantModifiersMap.get(modifier.restaurantId) ?? [];
      restaurantModifiersMap.set(modifier.restaurantId, [
        ...existing,
        modifier.id!,
      ]);
    }

    // Build owner -> restaurants map
    const ownerToRestaurantsMap = new Map<string, string[]>();
    for (const restaurant of restaurants) {
      if (!restaurant.ownerId) continue;
      const existing = ownerToRestaurantsMap.get(restaurant.ownerId) ?? [];
      ownerToRestaurantsMap.set(restaurant.ownerId, [
        ...existing,
        restaurant.id!,
      ]);
    }

    // Build owner -> cuisines map (for menu generation)
    const ownerCuisineMap = new Map<string, CuisineType[]>();
    for (const restaurant of restaurants) {
      if (!restaurant.ownerId) continue;
      const existing = ownerCuisineMap.get(restaurant.ownerId) ?? [];
      ownerCuisineMap.set(restaurant.ownerId, [
        ...existing,
        restaurant.cuisineType,
      ]);
    }

    // Generate dish menus (now cuisine-aware)
    const dishMenus: DishMenuWithCuisine[] = mockDishMenus({
      ownerIds,
      count: SEED_CONFIG.dishMenusPerOwner,
      ownerCuisineMap,
    });

    // Generate categories for each menu
    const allDishCategories = dishMenus.flatMap((menu) =>
      mockDishCategories({
        menuId: menu.id!,
        cuisineType: menu.cuisineType,
        maxCategories: SEED_CONFIG.categoriesPerMenu,
      }),
    );

    // Build menuCategoriesMap: menuId -> (categoryName -> categoryId)
    const menuCategoriesMap = new Map<string, Map<string, string>>();
    for (const category of allDishCategories) {
      const menuId = category.menuId;
      const categoryId = category.id;
      const categoryName = category.name;
      if (!categoryId || !categoryName) continue;
      if (!menuCategoriesMap.has(menuId)) {
        menuCategoriesMap.set(menuId, new Map());
      }
      menuCategoriesMap.get(menuId)!.set(categoryName, categoryId);
    }

    // Generate menu -> restaurant assignments
    const menuToRestaurants = mockMenuToRestaurants({
      menus: dishMenus,
      ownerToRestaurantsMap,
    });

    // Build menu -> restaurants map for dish prices
    const menuToRestaurantsMap = new Map<string, string[]>();
    for (const mtr of menuToRestaurants) {
      const existing = menuToRestaurantsMap.get(mtr.dishesMenuId) ?? [];
      menuToRestaurantsMap.set(mtr.dishesMenuId, [
        ...existing,
        mtr.restaurantId,
      ]);
    }

    // Generate dishes (now cuisine-aware via menu, with category names)
    const allDishes: DishWithCategory[] = dishMenus.flatMap((menu) =>
      mockDishes({
        menuId: menu.id!,
        count: SEED_CONFIG.dishesPerMenu,
        cuisineType: menu.cuisineType,
      }),
    );

    // Generate dish -> category assignments
    const dishesToCategories = mockDishesToCategories({
      dishes: allDishes,
      menuCategoriesMap,
    });

    // Generate dish prices (dishes -> restaurants)
    const dishPrices = mockDishPrices({
      dishes: allDishes.map((d) => ({ id: d.id!, menuId: d.menuId ?? null })),
      menuToRestaurantsMap,
      currency: "EUR",
    });

    // Build restaurant -> workshops map
    const restaurantWorkshopsMap = new Map<string, string[]>();
    for (const workshop of allWorkshops) {
      const existing = restaurantWorkshopsMap.get(workshop.restaurantId) ?? [];
      restaurantWorkshopsMap.set(workshop.restaurantId, [
        ...existing,
        workshop.id!,
      ]);
    }

    // Generate dish -> workshop assignments
    const dishWorkshops = mockDishWorkshops({
      dishPrices,
      restaurantWorkshopsMap,
    });

    // Workers to restaurants assignment
    const workersToRestaurants = regularWorkers.map((worker) => ({
      workerId: worker.id!,
      restaurantId: faker.helpers.arrayElement(restaurantIds),
    }));

    // Build restaurant -> workers map (CASHIER and ADMIN only)
    const restaurantWorkersMap = new Map<string, string[]>();
    for (const wtr of workersToRestaurants) {
      const worker = regularWorkers.find((w) => w.id === wtr.workerId);
      if (!worker) continue;
      // Only CASHIER and ADMIN can manage workshifts
      if (worker.role !== "CASHIER" && worker.role !== "ADMIN") continue;

      const existing = restaurantWorkersMap.get(wtr.restaurantId) ?? [];
      restaurantWorkersMap.set(wtr.restaurantId, [...existing, wtr.workerId]);
    }

    // Build restaurant -> payment categories map (leaf categories only)
    const restaurantPaymentCategoriesMap = new Map<
      string,
      Map<WorkshiftPaymentType, string[]>
    >();
    for (const category of allWorkshiftPaymentCategories) {
      // Skip parent categories (only use leaf categories)
      const hasChildren = allWorkshiftPaymentCategories.some(
        (c) => c.parentId === category.id,
      );
      if (hasChildren) continue;

      if (!restaurantPaymentCategoriesMap.has(category.restaurantId)) {
        restaurantPaymentCategoriesMap.set(category.restaurantId, new Map());
      }
      const typeMap = restaurantPaymentCategoriesMap.get(
        category.restaurantId,
      )!;
      const existing =
        typeMap.get(category.type! as WorkshiftPaymentType) ?? [];
      typeMap.set(category.type! as WorkshiftPaymentType, [
        ...existing,
        category.id!,
      ]);
    }

    // Generate workshifts
    const allWorkshifts = mockWorkshifts({
      restaurants: restaurants.map((r) => ({
        id: r.id!,
        currency: r.currency!,
      })),
      historyDays: SEED_CONFIG.workshifts.historyDays,
      restaurantWorkersMap,
    });

    // Generate workshift payments
    const allWorkshiftPayments = mockWorkshiftPayments({
      workshifts: allWorkshifts.map((w) => ({
        id: w.id!,
        restaurantId: w.restaurantId,
        status: w.status!,
        openedAt: w.openedAt ?? null,
        closedAt: w.closedAt ?? null,
      })),
      restaurantCategoriesMap: restaurantPaymentCategoriesMap,
      restaurantWorkersMap,
      minPaymentsPerType:
        SEED_CONFIG.workshifts.paymentsPerWorkshiftPerType.min,
      maxPaymentsPerType:
        SEED_CONFIG.workshifts.paymentsPerWorkshiftPerType.max,
      removalRate: SEED_CONFIG.workshifts.paymentRemovalRate,
    });

    // Build restaurant data for orders
    const restaurantPaymentMap = new Map<string, string[]>();
    for (const pm of paymentMethods) {
      const existing = restaurantPaymentMap.get(pm.restaurantId) ?? [];
      restaurantPaymentMap.set(pm.restaurantId, [...existing, pm.id!]);
    }

    const restaurantsWithPayments: RestaurantWithPaymentMethods[] =
      restaurants.map((r) => ({
        id: r.id!,
        currency: r.currency!,
        paymentMethodIds: restaurantPaymentMap.get(r.id!) ?? [],
      }));

    // Build dish -> categoryIds map from dishesToCategories
    const dishCategoryIdsMap = new Map<string, string[]>();
    for (const dtc of dishesToCategories) {
      const existing = dishCategoryIdsMap.get(dtc.dishId) ?? [];
      dishCategoryIdsMap.set(dtc.dishId, [...existing, dtc.dishCategoryId]);
    }

    // Build restaurant -> dishes map for orders (with menuId and categoryIds for discounts)
    const restaurantDishesMap = new Map<string, DishWithPriceType[]>();
    for (const dp of dishPrices) {
      const dish = allDishes.find((d) => d.id === dp.dishId);
      if (!dish) continue;

      const existing = restaurantDishesMap.get(dp.restaurantId) ?? [];
      restaurantDishesMap.set(dp.restaurantId, [
        ...existing,
        {
          id: dish.id!,
          name: dish.name!,
          price: dp.price!,
          restaurantId: dp.restaurantId,
          menuId: dish.menuId ?? "",
          categoryIds: dishCategoryIdsMap.get(dish.id!) ?? [],
        },
      ]);
    }

    // Generate discounts
    const discountsWithConnections = mockDiscounts({
      restaurantIds,
      menuToRestaurantsMap,
      menuCategoriesMap,
    });

    // Extract discounts and connections for DB insertion
    const allDiscounts = discountsWithConnections.map((d) => d.discount);
    const allDiscountConnections = discountsWithConnections.flatMap(
      (d) => d.connections,
    );

    // Build discount lookup map for order dish calculation
    const discountMap = buildDiscountLookupMap(discountsWithConnections);

    // Generate orders (with guests and discounts)
    const justCreatedOrders = mockJustCreatedOrders({
      count: SEED_CONFIG.orders.justCreated,
      restaurants: restaurantsWithPayments,
      guests: guestInfoArray,
    });

    const ordersWithDishes = mockOrdersWithDishes({
      count: SEED_CONFIG.orders.justCreatedWithDishes,
      restaurants: restaurantsWithPayments,
      restaurantDishesMap,
      restaurantModifiersMap,
      guests: guestInfoArray,
      discountMap,
    });

    const sentToKitchenOrders = mockSentToKitchenOrders({
      count: SEED_CONFIG.orders.sentToKitchen,
      restaurants: restaurantsWithPayments,
      restaurantDishesMap,
      restaurantModifiersMap,
      guests: guestInfoArray,
      discountMap,
    });

    // Extract order dishes and modifier assignments
    const allOrderDishes = [
      ...ordersWithDishes.flatMap((o) => o.orderDishes),
      ...sentToKitchenOrders.flatMap((o) => o.orderDishes),
    ];

    const allModifierAssignments = [
      ...ordersWithDishes.flatMap((o) => o.modifierAssignments),
      ...sentToKitchenOrders.flatMap((o) => o.modifierAssignments),
    ];

    const allOrders = [
      ...justCreatedOrders,
      ...ordersWithDishes.map(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ({ orderDishes: _, modifierAssignments: __, ...o }) => o,
      ),
      ...sentToKitchenOrders.map(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ({ orderDishes: _, modifierAssignments: __, ...o }) => o,
      ),
    ];

    // History records
    const createdHistoryRecords = mockOrderHistoryRecords(allOrders, "created");
    const sentToKitchenHistoryRecords = mockOrderHistoryRecords(
      sentToKitchenOrders,
      "sent_to_kitchen",
    );
    const allHistoryRecords = [
      ...createdHistoryRecords,
      ...sentToKitchenHistoryRecords,
    ];

    // Strip extra fields before inserting (not in DB schema)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const restaurantsForDb = restaurants.map(({ cuisineType: _, ...r }) => r);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const dishMenusForDb = dishMenus.map(({ cuisineType: _, ...m }) => m);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const dishesForDb = allDishes.map(({ categoryName: _, ...d }) => d);

    // ============================================================
    // PHASE 1: Insert workers, guests, and restaurants
    // ============================================================
    await withTiming(
      `Phase 1: Workers + Guests (${allGuests.length}) + Restaurants`,
      async () => {
        await insertChunked(schema.workers, allWorkers);
        await insertChunked(schema.guests, allGuests);
        await insertChunked(schema.restaurants, restaurantsForDb);
      },
    );

    // ============================================================
    // PHASE 2: Insert restaurant info (parallel)
    // ============================================================
    await withTiming(
      "Phase 2: Restaurant info (hours, workshops, etc)",
      async () => {
        await Promise.all([
          insertChunked(schema.restaurantHours, restaurantHours),
          insertChunked(schema.restaurantWorkshops, allWorkshops),
          insertChunked(schema.paymentMethods, paymentMethods),
          insertChunked(schema.dishModifiers, allDishModifiers),
          insertChunked(
            schema.workshiftPaymentCategories,
            allWorkshiftPaymentCategories,
          ),
          insertChunked(schema.workersToRestaurants, workersToRestaurants),
        ]);
      },
    );

    // ============================================================
    // PHASE 3: Insert menus, categories, and dishes
    // ============================================================
    await withTiming(
      `Phase 3: Menus + Categories (${allDishCategories.length}) + Dishes`,
      async () => {
        await insertChunked(schema.dishesMenus, dishMenusForDb);
        await insertChunked(schema.dishesMenusToRestaurants, menuToRestaurants);
        await insertChunked(schema.dishCategories, allDishCategories);
        await insertChunked(schema.dishes, dishesForDb);
      },
    );

    // ============================================================
    // PHASE 4: Insert dish relationships
    // ============================================================
    await withTiming(
      `Phase 4: Dish relationships (prices, workshops, categories: ${dishesToCategories.length})`,
      async () => {
        await Promise.all([
          insertChunked(schema.dishesToRestaurants, dishPrices),
          insertChunked(schema.dishesToWorkshops, dishWorkshops),
          insertChunked(schema.dishesToDishCategories, dishesToCategories),
        ]);
      },
    );

    // ============================================================
    // PHASE 4.5: Insert discounts
    // ============================================================
    await withTiming(
      `Phase 4.5: Discounts (${allDiscounts.length} discounts, ${allDiscountConnections.length} connections)`,
      async () => {
        if (allDiscounts.length > 0) {
          await insertChunked(schema.discounts, allDiscounts);
        }
        if (allDiscountConnections.length > 0) {
          await insertChunked(
            schema.discountsConnections,
            allDiscountConnections,
          );
        }
      },
    );

    // ============================================================
    // PHASE 5: Insert orders
    // ============================================================
    await withTiming(
      `Phase 5: Orders (${allOrders.length} orders, ${allOrderDishes.length} order dishes, ${allModifierAssignments.length} modifier assignments)`,
      async () => {
        await Promise.all([
          insertChunked(schema.orders, allOrders),
          insertChunked(schema.orderDishes, allOrderDishes),
          insertChunked(schema.orderHistoryRecords, allHistoryRecords),
        ]);

        // Insert modifier assignments after order dishes exist
        if (allModifierAssignments.length > 0) {
          await insertChunked(
            schema.dishModifiersToOrderDishes,
            allModifierAssignments,
          );
        }
      },
    );

    // ============================================================
    // PHASE 6: Insert workshifts and payments
    // ============================================================
    await withTiming(
      `Phase 6: Workshifts (${allWorkshifts.length} workshifts, ${allWorkshiftPayments.length} payments)`,
      async () => {
        await insertChunked(schema.workshifts, allWorkshifts);
        await insertChunked(schema.workshiftPayments, allWorkshiftPayments);
      },
    );
  });

  const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
  log(`Seed complete! Total time: ${totalTime}s`);

  // Cleanup
  await closePool();
  process.exit(0);
}

main().catch((error) => {
  logError(`Seed failed: ${error}`);
  closePool().finally(() => process.exit(1));
});
