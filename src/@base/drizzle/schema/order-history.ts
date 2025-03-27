import { orderHistoryTypeEnum } from "@postgress-db/schema/order-enums";
import { orders } from "@postgress-db/schema/orders";
import { workers } from "@postgress-db/schema/workers";
import { relations } from "drizzle-orm";
import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

export const orderHistoryRecords = pgTable("order_history_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull(),
  workerId: uuid("worker_id"),
  type: orderHistoryTypeEnum("type").notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

export type IOrderHistoryRecord = typeof orderHistoryRecords.$inferSelect;

export const orderHistoryRecordsRelations = relations(
  orderHistoryRecords,
  ({ one }) => ({
    order: one(orders, {
      fields: [orderHistoryRecords.orderId],
      references: [orders.id],
    }),
    worker: one(workers, {
      fields: [orderHistoryRecords.workerId],
      references: [workers.id],
    }),
  }),
);
