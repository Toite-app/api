import dotenv from "dotenv";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
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

dotenv.config({
  path: "utils/seed/.env",
});

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
export type DrizzleTransaction = Parameters<
  Parameters<DrizzleDatabase["transaction"]>[0]
>[0];

const connectionString = `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@localhost:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;

const pool = new Pool({
  connectionString,
});

const db = drizzle(pool, {
  schema,
});

export default db;
