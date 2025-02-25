import { dishesToWorkshops } from "@postgress-db/schema/dishes";
import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { restaurants } from "./restaurants";
import { workers } from "./workers";

export const restaurantWorkshops = pgTable("restaurantWorkshop", {
  // Primary key //
  id: uuid("id").defaultRandom().primaryKey(),

  // Restaurant //
  restaurantId: uuid("restaurantId").notNull(),

  // Name of the workshop //
  name: text("name").notNull(),

  // Is label printing enabled? //
  isLabelPrintingEnabled: boolean("isLabelPrintingEnabled")
    .notNull()
    .default(false),

  // Is enabled? //
  isEnabled: boolean("isEnabled").notNull().default(true),

  // Timestamps //
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const restaurantWorkshopRelations = relations(
  restaurantWorkshops,
  ({ one, many }) => ({
    restaurant: one(restaurants, {
      fields: [restaurantWorkshops.restaurantId],
      references: [restaurants.id],
    }),
    workers: many(workshopWorkers),
    dishesToWorkshops: many(dishesToWorkshops),
  }),
);

export type IRestaurantWorkshop = typeof restaurantWorkshops.$inferSelect;

export const workshopWorkers = pgTable("workshopWorkers", {
  workerId: uuid("workerId")
    .notNull()
    .references(() => workers.id),
  workshopId: uuid("workshopId")
    .notNull()
    .references(() => restaurantWorkshops.id),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const workshopWorkerRelations = relations(
  workshopWorkers,
  ({ one }) => ({
    worker: one(workers, {
      fields: [workshopWorkers.workerId],
      references: [workers.id],
    }),
    workshop: one(restaurantWorkshops, {
      fields: [workshopWorkers.workshopId],
      references: [restaurantWorkshops.id],
    }),
  }),
);

export type IWorkshopWorker = typeof workshopWorkers.$inferSelect;
