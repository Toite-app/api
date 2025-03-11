import { dishModifiersToOrderDishes } from "@postgress-db/schema/dish-modifiers";
import { dishes } from "@postgress-db/schema/dishes";
import { orders } from "@postgress-db/schema/orders";
import { workers } from "@postgress-db/schema/workers";
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

export const orderDishStatusEnum = pgEnum("order_dish_status_enum", [
  "pending",
  "cooking",
  "ready",
  "completed",
]);

export const ZodOrderDishStatusEnum = z.enum(orderDishStatusEnum.enumValues);

export type OrderDishStatusEnum = typeof ZodOrderDishStatusEnum._type;

export const orderDishes = pgTable(
  "order_dishes",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Relation fields //
    orderId: uuid("order_id").notNull(),
    dishId: uuid("dish_id").notNull(),
    discountId: uuid("discount_id"),
    surchargeId: uuid("surcharge_id"),

    // Data //
    name: text("name").notNull(),
    status: orderDishStatusEnum("status").notNull(),

    // Quantity //
    quantity: integer("quantity").notNull(),
    quantityReturned: integer("quantity_returned").notNull().default(0),

    // Price info //
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    discountPercent: decimal("discount_percent", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    discountAmount: decimal("discount_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    surchargePercent: decimal("surcharge_percent", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    surchargeAmount: decimal("surcharge_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    finalPrice: decimal("final_price", { precision: 10, scale: 2 }).notNull(),

    // Booleans flags //
    isRemoved: boolean("is_removed").notNull().default(false),
    isAdditional: boolean("is_additional").notNull().default(false),

    // Timestamps //
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    cookingAt: timestamp("cooking_at"),
    readyAt: timestamp("ready_at"),
    removedAt: timestamp("removed_at"),
  },
  (table) => [index("order_dishes_order_id_idx").on(table.orderId)],
);

export type IOrderDish = typeof orderDishes.$inferSelect;

export const orderDishRelations = relations(orderDishes, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderDishes.orderId],
    references: [orders.id],
  }),
  dish: one(dishes, {
    fields: [orderDishes.dishId],
    references: [dishes.id],
  }),
  dishModifiersToOrderDishes: many(dishModifiersToOrderDishes),
  returnments: many(orderDishesReturnments),
}));

export const orderDishesReturnments = pgTable("order_dishes_returnments", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Relations //
  orderDishId: uuid("order_dish_id").notNull(),
  workerId: uuid("worker_id").notNull(),

  // Returned quantity //
  quantity: integer("quantity").notNull(),

  // Reason //
  reason: text("reason").notNull(),

  // Timestamps //
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type IOrderDishReturnment = typeof orderDishesReturnments.$inferSelect;

export const orderDishReturnmentRelations = relations(
  orderDishesReturnments,
  ({ one }) => ({
    orderDish: one(orderDishes, {
      fields: [orderDishesReturnments.orderDishId],
      references: [orderDishes.id],
    }),
    worker: one(workers, {
      fields: [orderDishesReturnments.workerId],
      references: [workers.id],
    }),
  }),
);
