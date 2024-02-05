import { relations, sql } from "drizzle-orm";
import {
  boolean,
  pgTable,
  text,
  numeric,
  timestamp,
  time,
  uuid,
} from "drizzle-orm/pg-core";
import { workers } from "./workers";

export const restaurants = pgTable("restaurants", {
  // Primary key
  id: uuid("id").defaultRandom(),

  // Name of the restaurant //
  name: text("name").notNull(),

  // Legal entity of the restaurant (can be a company or a person) //
  legalEntity: text("legalEntity"),

  // Address of the restaurant //
  address: text("address"),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),

  // Is the restaurant enabled? //
  isEnabled: boolean("isEnabled").default(false),

  // Timestamps //
  createdAt: timestamp("createdAt")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),

  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const restaurantHours = pgTable("restaurantHours", {
  // Primary key //
  id: uuid("id").defaultRandom(),

  // Restaurant //
  restaurantId: uuid("restaurantId").notNull(),

  // Day of the week //
  dayOfWeek: text("dayOfWeek").notNull(),

  // Opening and closing hours //
  openingTime: time("openingTime").notNull(),
  closingTime: time("closingTime").notNull(),

  isEnabled: boolean("isEnabled").default(true),

  // Timestamps //
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const restaurantRelations = relations(restaurants, ({ many }) => ({
  restaurantHours: many(restaurantHours),
  workers: many(workers),
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
