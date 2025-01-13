import { restaurants } from "@postgress-db/schema/restaurants";
import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";

export const orderTypeEnum = pgEnum("orderTypeEnum", [
  "hall",
  "banquet",
  "takeaway",
  "delivery",
]);

export const ZodOrderTypeEnum = z.enum(orderTypeEnum.enumValues);

export type OrderTypeEnum = typeof ZodOrderTypeEnum._type;

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Links //
  restaurantId: uuid("restaurantId"),

  // Order number //
  number: integer("number").notNull(),

  // Table number //
  tableNumber: text("tableNumber"),

  // Order type //
  type: orderTypeEnum("type").notNull(),

  // Note from the admins //
  note: text("note").notNull().default(""),

  // Guest information //
  guestId: uuid("guestId"),
  phone: text("phone"),
  guestName: text("guestName"),

  // Guests amount //
  guestsAmount: integer("guestsAmount"),

  // Booleans flags //
  isHidden: boolean("isHidden").notNull().default(false),
  isAppOrder: boolean("isAppOrder").notNull().default(false),

  // Default timestamps
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  deliveredAt: timestamp("deliveredAt"),
  archivedAt: timestamp("archivedAt"),
  removedAt: timestamp("removedAt"),
});

export type IOrder = typeof orders.$inferSelect;

export const orderRelations = relations(orders, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [orders.restaurantId],
    references: [restaurants.id],
  }),
}));
