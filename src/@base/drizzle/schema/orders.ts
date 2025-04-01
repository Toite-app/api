import { currencyEnum } from "@postgress-db/schema/general";
import { guests } from "@postgress-db/schema/guests";
import { orderDeliveries } from "@postgress-db/schema/order-deliveries";
import { orderDishes } from "@postgress-db/schema/order-dishes";
import { orderHistoryRecords } from "@postgress-db/schema/order-history";
import { orderPrechecks } from "@postgress-db/schema/order-prechecks";
import { paymentMethods } from "@postgress-db/schema/payment-methods";
import { restaurants } from "@postgress-db/schema/restaurants";
import { relations } from "drizzle-orm";
import {
  boolean,
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { orderFromEnum, orderStatusEnum, orderTypeEnum } from "./order-enums";

export const orderNumberBroneering = pgTable("order_number_broneering", {
  id: uuid("id").defaultRandom().primaryKey(),
  number: text("number").notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Links //
    guestId: uuid("guest_id"),
    restaurantId: uuid("restaurant_id"),
    paymentMethodId: uuid("payment_method_id"),

    // Order number //
    number: text("number").notNull(),
    tableNumber: text("table_number"),

    // Order type //
    type: orderTypeEnum("type").notNull(),
    status: orderStatusEnum("status").notNull(),
    currency: currencyEnum("currency").notNull(),
    from: orderFromEnum("from").notNull(),

    // Note from the admins //
    note: text("note"),

    // Guest information //
    guestName: text("guest_name"),
    guestPhone: text("guest_phone"),
    guestsAmount: integer("guests_amount"),

    // Price info //
    subtotal: decimal("subtotal", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    discountAmount: decimal("discount_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    surchargeAmount: decimal("surcharge_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    bonusUsed: decimal("bonusUsed", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    total: decimal("total", { precision: 10, scale: 2 }).notNull().default("0"),

    // Booleans flags //
    isHiddenForGuest: boolean("is_hidden_for_guest").notNull().default(false),
    isRemoved: boolean("is_removed").notNull().default(false),
    isArchived: boolean("is_archived").notNull().default(false),

    // Default timestamps
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    cookingAt: timestamp("cooking_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    removedAt: timestamp("removed_at", { withTimezone: true }),
    delayedTo: timestamp("delayed_to", { withTimezone: true }),
  },
  (table) => [
    index("orders_restaurant_id_idx").on(table.restaurantId),
    index("orders_created_at_idx").on(table.createdAt),
    index("orders_is_archived_idx").on(table.isArchived),
    index("orders_is_removed_idx").on(table.isRemoved),
    index("order_id_and_created_at_idx").on(table.id, table.createdAt),
    index("orders_status_idx").on(table.status),
    index("orders_delayed_to_idx").on(table.delayedTo),
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
  prechecks: many(orderPrechecks),
  historyRecords: many(orderHistoryRecords),
}));
