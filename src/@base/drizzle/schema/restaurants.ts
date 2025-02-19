import { dishModifiers } from "@postgress-db/schema/dish-modifiers";
import { dishesToRestaurants } from "@postgress-db/schema/dishes";
import { orders } from "@postgress-db/schema/orders";
import { paymentMethods } from "@postgress-db/schema/payment-methods";
import { restaurantWorkshops } from "@postgress-db/schema/restaurant-workshop";
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
  legalEntity: text("legalEntity").notNull(),

  // Address of the restaurant //
  address: text("address").notNull(),
  latitude: numeric("latitude").notNull(),
  longitude: numeric("longitude").notNull(),

  // Timezone of the restaurant //
  timezone: text("timezone").notNull().default("Europe/Tallinn"),

  // Currency of the restaurant //
  currency: currencyEnum("currency").notNull().default("EUR"),

  // Country code of the restaurant (used for mobile phone default and etc.) //
  countryCode: text("countryCode").notNull().default("EE"),

  // Is the restaurant enabled? //
  isEnabled: boolean("isEnabled").notNull().default(false),

  // Is closed forever? //
  isClosedForever: boolean("isClosedForever").notNull().default(false),

  // Owner of the restaurant //
  ownerId: uuid("ownerId"),

  // Timestamps //
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const restaurantHours = pgTable("restaurantHours", {
  // Primary key //
  id: uuid("id").defaultRandom().primaryKey(),

  // Restaurant //
  restaurantId: uuid("restaurantId").notNull(),

  // Day of the week //
  dayOfWeek: dayOfWeekEnum("dayOfWeek").notNull(),

  // Opening and closing hours //
  openingTime: text("openingTime").notNull(),
  closingTime: text("closingTime").notNull(),

  isEnabled: boolean("isEnabled").notNull().default(true),

  // Timestamps //
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
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
