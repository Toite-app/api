import { currencyEnum } from "@postgress-db/schema/general";
import { workers } from "@postgress-db/schema/workers";
import { workshifts } from "@postgress-db/schema/workshifts";
import { relations } from "drizzle-orm";
import {
  boolean,
  decimal,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const workshiftPayments = pgTable("workshift_payments", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Fields //
  note: text("note"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: currencyEnum("currency").notNull(),

  // Workshift ID //
  workshiftId: uuid("workshift_id").notNull(),

  // Worker ID (if exists) //
  workerId: uuid("worker_id"),
  removedByWorkerId: uuid("removed_by_worker_id"),

  // Boolean fields //
  isRemoved: boolean("is_removed").notNull().default(false),

  // Timestamps //
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  removedAt: timestamp("removed_at"),
});

export type IWorkshiftPayment = typeof workshiftPayments.$inferSelect;

export const workshiftPaymentRelations = relations(
  workshiftPayments,
  ({ one }) => ({
    workshift: one(workshifts, {
      fields: [workshiftPayments.workshiftId],
      references: [workshifts.id],
    }),
    worker: one(workers, {
      fields: [workshiftPayments.workerId],
      references: [workers.id],
      relationName: "workshiftPaymentsWorker",
    }),
    removedByWorker: one(workers, {
      fields: [workshiftPayments.removedByWorkerId],
      references: [workers.id],
      relationName: "workshiftPaymentsRemovedByWorker",
    }),
  }),
);
