import { restaurants } from "@postgress-db/schema/restaurants";
import { workers } from "@postgress-db/schema/workers";
import { workshiftPayments } from "@postgress-db/schema/workshift-payments";
import { relations } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";

export const workshiftStatusEnum = pgEnum("workshift_status_enum", [
  "PLANNED" as const,
  "OPENED" as const,
  "CLOSED" as const,
]);

export const ZodWorkshiftStatus = z.enum(workshiftStatusEnum.enumValues);

export enum IWorkshiftStatus {
  PLANNED = "PLANNED",
  OPENED = "OPENED",
  CLOSED = "CLOSED",
}

export const workshifts = pgTable("workshifts", {
  id: uuid("id").defaultRandom().primaryKey(),
  status: workshiftStatusEnum("status")
    .notNull()
    .default(IWorkshiftStatus.PLANNED),

  // Restaurant for which the workshift is //
  restaurantId: uuid("restaurant_id").notNull(),

  // User IDs //
  openedByWorkerId: uuid("opened_by_worker_id"),
  closedByWorkerId: uuid("closed_by_worker_id"),

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
  openedAt: timestamp("opened_at", { withTimezone: true }),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

export type IWorkshift = typeof workshifts.$inferSelect;

export const workshiftsRelations = relations(workshifts, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [workshifts.restaurantId],
    references: [restaurants.id],
  }),
  openedByWorker: one(workers, {
    fields: [workshifts.openedByWorkerId],
    references: [workers.id],
    relationName: "workshiftsOpened",
  }),
  closedByWorker: one(workers, {
    fields: [workshifts.closedByWorkerId],
    references: [workers.id],
    relationName: "workshiftsClosed",
  }),
  workersToWorkshifts: many(workersToWorkshifts),
  payments: many(workshiftPayments),
}));

export const workersToWorkshifts = pgTable(
  "workers_to_workshifts",
  {
    workerId: uuid("worker_id").notNull(),
    workshiftId: uuid("workshift_id").notNull(),
  },
  (t) => [
    primaryKey({
      columns: [t.workerId, t.workshiftId],
    }),
  ],
);

export type IWorkersToWorkshifts = typeof workersToWorkshifts.$inferSelect;

export const workersToWorkshiftsRelations = relations(
  workersToWorkshifts,
  ({ one }) => ({
    worker: one(workers, {
      fields: [workersToWorkshifts.workerId],
      references: [workers.id],
    }),
    workshift: one(workshifts, {
      fields: [workersToWorkshifts.workshiftId],
      references: [workshifts.id],
    }),
  }),
);
