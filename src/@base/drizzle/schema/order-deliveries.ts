import { orders } from "@postgress-db/schema/orders";
import { workers } from "@postgress-db/schema/workers";
import { relations } from "drizzle-orm";
import {
  decimal,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";

export const orderDeliveryStatusEnum = pgEnum("orderDeliveryStatusEnum", [
  "pending",
  "dispatched",
  "delivered",
]);

export const ZodOrderDeliveryStatusEnum = z.enum(
  orderDeliveryStatusEnum.enumValues,
);

export type OrderDeliveryStatusEnum = typeof ZodOrderDeliveryStatusEnum._type;

export const orderDeliveries = pgTable("orderDeliveries", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Relation fields //
  orderId: uuid("orderId").notNull(),
  workerId: uuid("workerId"),

  // Data //
  status: orderDeliveryStatusEnum("status").notNull(),
  address: text("address").notNull(),
  note: text("note"),
  latitude: numeric("latitude").notNull(),
  longitude: numeric("longitude").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),

  // Timestamps //
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  dispatchedAt: timestamp("dispatchedAt"),
  estimatedDeliveryAt: timestamp("estimatedDeliveryAt"),
  deliveredAt: timestamp("deliveredAt"),
});

export type IOrderDelivery = typeof orderDeliveries.$inferSelect;

export const orderDeliveryRelations = relations(orderDeliveries, ({ one }) => ({
  order: one(orders, {
    fields: [orderDeliveries.orderId],
    references: [orders.id],
  }),
  worker: one(workers, {
    fields: [orderDeliveries.workerId],
    references: [workers.id],
  }),
}));
