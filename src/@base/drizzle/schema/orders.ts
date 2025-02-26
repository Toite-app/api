import { currencyEnum } from "@postgress-db/schema/general";
import { guests } from "@postgress-db/schema/guests";
import { orderDeliveries } from "@postgress-db/schema/order-deliveries";
import { orderDishes } from "@postgress-db/schema/order-dishes";
import { paymentMethods } from "@postgress-db/schema/payment-methods";
import { restaurants } from "@postgress-db/schema/restaurants";
import { relations } from "drizzle-orm";
import {
  boolean,
  decimal,
  index,
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
  "delivering",
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

export const orderNumberBroneering = pgTable("orderNumberBroneering", {
  id: uuid("id").defaultRandom().primaryKey(),
  number: text("number").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Links //
    guestId: uuid("guestId"),
    restaurantId: uuid("restaurantId"),
    paymentMethodId: uuid("paymentMethodId"),

    // Order number //
    number: text("number").notNull(),
    tableNumber: text("tableNumber"),

    // Order type //
    type: orderTypeEnum("type").notNull(),
    status: orderStatusEnum("status").notNull(),
    currency: currencyEnum("currency").notNull(),
    from: orderFromEnum("from").notNull(),

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
    isArchived: boolean("isArchived").notNull().default(false),

    // Default timestamps
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    cookingAt: timestamp("cookingAt"),
    completedAt: timestamp("completedAt"),
    removedAt: timestamp("removedAt"),
    delayedTo: timestamp("delayedTo"),
  },
  (table) => [
    index("orders_restaurantId_idx").on(table.restaurantId),
    index("orders_created_at_idx").on(table.createdAt),
    index("orders_isArchived_idx").on(table.isArchived),
    index("orders_isRemoved_idx").on(table.isRemoved),
    index("order_id_and_created_at_idx").on(table.id, table.createdAt),
  ],
);

export type IOrder = typeof orders.$inferSelect;

export const orderRelations = relations(orders, ({ one, many }) => ({
  paymentMethod: one(paymentMethods, {
    fields: [orders.paymentMethodId],
    references: [paymentMethods.id],
  }),
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
