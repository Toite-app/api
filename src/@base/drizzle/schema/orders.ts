import { currencyEnum } from "@postgress-db/schema/general";
import { guests } from "@postgress-db/schema/guests";
import { orderDeliveries } from "@postgress-db/schema/order-deliveries";
import { orderDishes } from "@postgress-db/schema/order-dishes";
import { restaurants } from "@postgress-db/schema/restaurants";
import { relations } from "drizzle-orm";
import {
  boolean,
  decimal,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";

export const orderFromEnum = pgEnum("orderFromEnum", [
  "app",
  "website",
  "internal",
]);

export const ZodOrderFromEnum = z.enum(orderFromEnum.enumValues);

export type OrderFromEnum = typeof ZodOrderFromEnum._type;

export const orderStatusEnum = pgEnum("orderStatusEnum", [
  "pending",
  "cooking",
  "ready",
  "deliverying",
  "paid",
  "completed",
  "cancelled",
]);

export const ZodOrderStatusEnum = z.enum(orderStatusEnum.enumValues);

export type OrderStatusEnum = typeof ZodOrderStatusEnum._type;

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
  guestId: uuid("guestId"),
  restaurantId: uuid("restaurantId"),

  // Order number //
  number: integer("number").notNull(),
  tableNumber: text("tableNumber"),

  // Order type //
  type: orderTypeEnum("type").notNull(),
  status: orderStatusEnum("status").notNull(),
  currency: currencyEnum("currency").notNull(),

  // Note from the admins //
  note: text("note"),

  // Guest information //
  guestName: text("guestName"),
  guestPhone: text("guestPhone"),
  guestsAmount: integer("guestsAmount"),

  // Price info //
  subtotal: decimal("subtotal", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  discountAmount: decimal("discountAmount", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  surchargeAmount: decimal("surchargeAmount", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  bonusUsed: decimal("bonusUsed", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull().default("0"),

  // Booleans flags //
  isHiddenForGuest: boolean("isHiddenForGuest").notNull().default(false),
  isRemoved: boolean("isRemoved").notNull().default(false),

  // Default timestamps
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  removedAt: timestamp("removedAt"),
});

export type IOrder = typeof orders.$inferSelect;

export const orderRelations = relations(orders, ({ one, many }) => ({
  delivery: one(orderDeliveries, {
    fields: [orders.id],
    references: [orderDeliveries.orderId],
  }),
  restaurant: one(restaurants, {
    fields: [orders.restaurantId],
    references: [restaurants.id],
  }),
  guest: one(guests, {
    fields: [orders.guestId],
    references: [guests.id],
  }),
  orderDishes: many(orderDishes),
}));
