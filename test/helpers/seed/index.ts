import { DatabaseHelper } from "test/helpers/database";
import seedDishes from "test/helpers/seed/dishes";
import seedOrders from "test/helpers/seed/orders";
import seedRestaurants from "test/helpers/seed/restaurants";
import seedWorkers, { createSystemAdmin } from "test/helpers/seed/workers";

import "dotenv/config";

interface SeedVariantData {
  workers: number;
  restaurants: number;
  dishes: number;
  orders: {
    active: number;
    archived: number;
    removed: number;
  };
}

type SeedVariant = "mini";

const variants: Record<SeedVariant, SeedVariantData> = {
  mini: {
    workers: 50,
    restaurants: 10,
    dishes: 10,
    orders: {
      active: 10_000,
      removed: 10_000,
      archived: 80_000,
    },
  },
};

async function seed(variant: SeedVariantData) {
  await DatabaseHelper.truncateAll();
  await DatabaseHelper.push();

  await createSystemAdmin();
  await seedRestaurants(variant.restaurants);
  await seedWorkers(variant.workers);
  await seedDishes(variant.dishes);
  await seedOrders(variant.orders);
}

seed(variants.mini);
