import { currencyEnum, localeEnum } from "@postgress-db/schema/general";
import { orders } from "@postgress-db/schema/orders";
import { workers } from "@postgress-db/schema/workers";
import { relations } from "drizzle-orm";
import {
  decimal,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { orderTypeEnum } from "./order-enums";

export const orderPrechecks = pgTable("order_prechecks", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Links //
  orderId: uuid("order_id").notNull(),

  // Worker who did the precheck //
  workerId: uuid("worker_id").notNull(),

  // Fields //
  type: orderTypeEnum("type").notNull(),
  legalEntity: text("legal_entity").notNull(),
  locale: localeEnum("locale").notNull(),
  currency: currencyEnum("currency").notNull(),

  // Timestamps //
  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

export type IOrderPrecheck = typeof orderPrechecks.$inferSelect;

export const orderPrechecksRelations = relations(
  orderPrechecks,
  ({ one, many }) => ({
    order: one(orders, {
      fields: [orderPrechecks.orderId],
      references: [orders.id],
    }),
    worker: one(workers, {
      fields: [orderPrechecks.workerId],
      references: [workers.id],
    }),
    positions: many(orderPrecheckPositions),
  }),
);

export const orderPrecheckPositions = pgTable("order_precheck_positions", {
  id: uuid("id").defaultRandom().primaryKey(),
  precheckId: uuid("precheck_id").notNull(),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  surchargeAmount: decimal("surcharge_amount", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }).notNull(),
});

export type IOrderPrecheckPosition = typeof orderPrecheckPositions.$inferSelect;

export const orderPrecheckPositionsRelations = relations(
  orderPrecheckPositions,
  ({ one }) => ({
    precheck: one(orderPrechecks, {
      fields: [orderPrecheckPositions.precheckId],
      references: [orderPrechecks.id],
    }),
  }),
);
