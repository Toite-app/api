import { relations, sql } from "drizzle-orm";
import {
  boolean,
  pgTable,
  serial,
  text,
  numeric,
  timestamp,
  time,
} from "drizzle-orm/pg-core";

export const restaurants = pgTable("restaurants", {
  // Primary key //
  id: serial("id").primaryKey().unique(),

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
  id: serial("id").primaryKey().unique(),

  // Restaurant //
  restaurantId: serial("restaurantId")
    .notNull()
    .references(() => restaurants.id),

  // Day of the week //
  dayOfWeek: text("dayOfWeek").notNull(),

  // Opening and closing hours //
  openingTime: time("openingTime").notNull(),
  closingTime: time("closingTime").notNull(),

  // Timestamps //
  createdAt: timestamp("createdAt").notNull().defaultNow(),

  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const restaurantHourRelations = relations(
  restaurantHours,
  ({ one }) => ({
    restaurant: one(restaurants, {
      fields: [restaurantHours.restaurantId],
      references: [restaurants.id],
    }),
  }),
);
