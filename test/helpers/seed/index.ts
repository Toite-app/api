import { DatabaseHelper } from "test/helpers/database";
import seedRestaurants from "test/helpers/seed/restaurants";
import seedWorkers, { createSystemAdmin } from "test/helpers/seed/workers";
import "dotenv/config";

interface SeedVariantData {
  workers: number;
  restaurants: number;
}

type SeedVariant = "mini";

const variants: Record<SeedVariant, SeedVariantData> = {
  mini: {
    workers: 50,
    restaurants: 10,
  },
};

async function seed(variant: SeedVariantData) {
  await DatabaseHelper.truncateAll();
  await DatabaseHelper.push();

  await createSystemAdmin();
  await seedRestaurants(variant.restaurants);
  await seedWorkers(variant.workers);
}

seed(variants.mini);
