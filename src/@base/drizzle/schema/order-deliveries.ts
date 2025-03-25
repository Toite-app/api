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

export const orderDeliveryStatusEnum = pgEnum("order_delivery_status_enum", [
  "pending",
  "dispatched",
  "delivered",
]);

export const ZodOrderDeliveryStatusEnum = z.enum(
  orderDeliveryStatusEnum.enumValues,
);

export type OrderDeliveryStatusEnum = typeof ZodOrderDeliveryStatusEnum._type;

export const orderDeliveries = pgTable("order_deliveries", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Relation fields //
  orderId: uuid("order_id").notNull(),
  workerId: uuid("worker_id"),

  // Data //
  status: orderDeliveryStatusEnum("status").notNull(),
  address: text("address").notNull(),
  note: text("note"),
  latitude: numeric("latitude").notNull(),
  longitude: numeric("longitude").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),

  // Timestamps //
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
  dispatchedAt: timestamp("dispatched_at", { withTimezone: true }),
  estimatedDeliveryAt: timestamp("estimated_delivery_at", {
    withTimezone: true,
  }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
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
