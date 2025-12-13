import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as discounts from "src/@base/drizzle/schema/discounts";
import * as dishCategories from "src/@base/drizzle/schema/dish-categories";
import * as dishModifiers from "src/@base/drizzle/schema/dish-modifiers";
import * as dishes from "src/@base/drizzle/schema/dishes";
import * as dishesMenus from "src/@base/drizzle/schema/dishes-menus";
import * as files from "src/@base/drizzle/schema/files";
import * as general from "src/@base/drizzle/schema/general";
import * as guests from "src/@base/drizzle/schema/guests";
import * as manyToMany from "src/@base/drizzle/schema/many-to-many";
import * as orderDeliveries from "src/@base/drizzle/schema/order-deliveries";
import * as orderDishes from "src/@base/drizzle/schema/order-dishes";
import * as orderEnums from "src/@base/drizzle/schema/order-enums";
import * as orderHistory from "src/@base/drizzle/schema/order-history";
import * as orderPrechecks from "src/@base/drizzle/schema/order-prechecks";
import * as orders from "src/@base/drizzle/schema/orders";
import * as paymentMethods from "src/@base/drizzle/schema/payment-methods";
import * as restaurantWorkshops from "src/@base/drizzle/schema/restaurant-workshop";
import * as restaurants from "src/@base/drizzle/schema/restaurants";
import * as sessions from "src/@base/drizzle/schema/sessions";
import * as workers from "src/@base/drizzle/schema/workers";
import * as workshiftEnums from "src/@base/drizzle/schema/workshift-enums";
import * as workshiftPaymentCategories from "src/@base/drizzle/schema/workshift-payment-category";
import * as workshiftPayments from "src/@base/drizzle/schema/workshift-payments";
import * as workshifts from "src/@base/drizzle/schema/workshifts";

import { log, logError } from "./utils";

export const schema = {
  ...general,
  ...restaurants,
  ...sessions,
  ...workers,
  ...restaurantWorkshops,
  ...guests,
  ...dishes,
  ...dishCategories,
  ...manyToMany,
  ...files,
  ...orderDishes,
  ...orderDeliveries,
  ...orderEnums,
  ...orders,
  ...orderPrechecks,
  ...orderHistory,
  ...paymentMethods,
  ...dishModifiers,
  ...discounts,
  ...dishesMenus,
  ...workshifts,
  ...workshiftEnums,
  ...workshiftPayments,
  ...workshiftPaymentCategories,
};

export type Schema = typeof schema;
export type DrizzleDatabase = NodePgDatabase<Schema>;

// Validate environment
const POSTGRESQL_URL = process.env.POSTGRESQL_URL;
if (!POSTGRESQL_URL) {
  logError("POSTGRESQL_URL environment variable is required");
  process.exit(1);
}

// Create connection pool
export const pool = new Pool({
  connectionString: POSTGRESQL_URL,
  ssl: false, // Never SSL per user choice
  max: 10, // Pool size for parallel inserts
});

// Create drizzle instance
const db = drizzle(pool, { schema });

export default db;

// Run database migrations
export async function runMigrations(): Promise<void> {
  log("Running migrations...");

  try {
    await migrate(db, {
      migrationsFolder: "./src/@base/drizzle/migrations",
    });
    log("Migrations complete");
  } catch (error) {
    logError(`Migration failed: ${error}`);
    throw error;
  }
}

// Check if database is empty (by checking workers table)
export async function ensureDatabaseEmpty(): Promise<void> {
  log("Checking database is empty...");

  const result = await db
    .select({ id: schema.workers.id })
    .from(schema.workers)
    .limit(1);

  if (result.length > 0) {
    logError("Database is not empty. Aborting.");
    process.exit(1);
  }

  log("Database is empty, proceeding...");
}

// Cleanup and close pool
export async function closePool(): Promise<void> {
  await pool.end();
}
