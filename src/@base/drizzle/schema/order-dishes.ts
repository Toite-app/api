import { dishes } from "@postgress-db/schema/dishes";
import { orders } from "@postgress-db/schema/orders";
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

export const orderDishStatusEnum = pgEnum("orderDishStatusEnum", [
  "pending",
  "cooking",
  "ready",
  "completed",
]);

export const ZodOrderDishStatusEnum = z.enum(orderDishStatusEnum.enumValues);

export type OrderDishStatusEnum = typeof ZodOrderDishStatusEnum._type;

export const orderDishes = pgTable(
  "orderDishes",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Relation fields //
    orderId: uuid("orderId").notNull(),
    dishId: uuid("dishId").notNull(),
    discountId: uuid("discountId"),
    surchargeId: uuid("surchargeId"),

    // Data //
    name: text("name").notNull(),
    status: orderDishStatusEnum("status").notNull(),

    // Quantity //
    quantity: integer("quantity").notNull(),
    quantityReturned: integer("quantityReturned").notNull().default(0),

    // Price info //
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    discountPercent: decimal("discountPercent", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    discountAmount: decimal("discountAmount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    surchargePercent: decimal("surchargePercent", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    surchargeAmount: decimal("surchargeAmount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    finalPrice: decimal("finalPrice", { precision: 10, scale: 2 }).notNull(),

    // Booleans flags //
    isRemoved: boolean("isRemoved").notNull().default(false),
    isAdditional: boolean("isAdditional").notNull().default(false),

    // Timestamps //
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    removedAt: timestamp("removedAt"),
  },
  (table) => [index("orderDishes_orderId_idx").on(table.orderId)],
);

export type IOrderDish = typeof orderDishes.$inferSelect;

export const orderDishRelations = relations(orderDishes, ({ one }) => ({
  order: one(orders, {
    fields: [orderDishes.orderId],
    references: [orders.id],
  }),
  dish: one(dishes, {
    fields: [orderDishes.dishId],
    references: [dishes.id],
  }),
}));
