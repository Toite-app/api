import { discountsToRestaurants } from "@postgress-db/schema/discounts";
import { dishModifiers } from "@postgress-db/schema/dish-modifiers";
import { dishesToRestaurants } from "@postgress-db/schema/dishes";
import { dishesMenusToRestaurants } from "@postgress-db/schema/dishes-menus";
import { orders } from "@postgress-db/schema/orders";
import { paymentMethods } from "@postgress-db/schema/payment-methods";
import { restaurantWorkshops } from "@postgress-db/schema/restaurant-workshop";
import { workshiftPaymentCategories } from "@postgress-db/schema/workshift-payment-category";
import { workshifts } from "@postgress-db/schema/workshifts";
import { relations } from "drizzle-orm";
import {
  boolean,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { currencyEnum, dayOfWeekEnum } from "./general";
import { workers, workersToRestaurants } from "./workers";

export const restaurants = pgTable("restaurants", {
  // Primary key
  id: uuid("id").defaultRandom().primaryKey(),

  // Name of the restaurant //
  name: text("name").notNull(),

  // Legal entity of the restaurant (can be a company or a person) //
  legalEntity: text("legal_entity").notNull(),

  // Address of the restaurant //
  address: text("address").notNull(),
  latitude: numeric("latitude").notNull(),
  longitude: numeric("longitude").notNull(),

  // Timezone of the restaurant //
  timezone: text("timezone").notNull().default("Europe/Tallinn"),

  // Currency of the restaurant //
  currency: currencyEnum("currency").notNull().default("EUR"),

  // Country code of the restaurant (used for mobile phone default and etc.) //
  countryCode: text("country_code").notNull().default("EE"),

  // Is the restaurant enabled? //
  isEnabled: boolean("is_enabled").notNull().default(false),

  // Is closed forever? //
  isClosedForever: boolean("is_closed_forever").notNull().default(false),

  // Owner of the restaurant //
  ownerId: uuid("owner_id"),

  // Timestamps //
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const restaurantHours = pgTable("restaurant_hours", {
  // Primary key //
  id: uuid("id").defaultRandom().primaryKey(),

  // Restaurant //
  restaurantId: uuid("restaurant_id").notNull(),

  // Day of the week //
  dayOfWeek: dayOfWeekEnum("day_of_week").notNull(),

  // Opening and closing hours //
  openingTime: text("opening_time").notNull(),
  closingTime: text("closing_time").notNull(),

  // Is enabled? //
  isEnabled: boolean("is_enabled").notNull().default(true),

  // Timestamps //
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const restaurantRelations = relations(restaurants, ({ one, many }) => ({
  restaurantHours: many(restaurantHours),
  workersToRestaurants: many(workersToRestaurants),
  workshops: many(restaurantWorkshops),
  orders: many(orders),
  dishesToRestaurants: many(dishesToRestaurants),
  paymentMethods: many(paymentMethods),
  owner: one(workers, {
    fields: [restaurants.ownerId],
    references: [workers.id],
  }),
  dishModifiers: many(dishModifiers),
  discountsToRestaurants: many(discountsToRestaurants),
  dishesMenusToRestaurants: many(dishesMenusToRestaurants),
  workshifts: many(workshifts),
  workshiftPaymentCategories: many(workshiftPaymentCategories),
}));

export const restaurantHourRelations = relations(
  restaurantHours,
  ({ one }) => ({
    restaurant: one(restaurants, {
      fields: [restaurantHours.restaurantId],
      references: [restaurants.id],
    }),
  }),
);

export type IRestaurant = typeof restaurants.$inferSelect;
export type IRestaurantHours = typeof restaurantHours.$inferSelect;
