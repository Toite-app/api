import { dishesToWorkshops } from "@postgress-db/schema/dishes";
import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { restaurants } from "./restaurants";
import { workers } from "./workers";

export const restaurantWorkshops = pgTable("restaurant_workshops", {
  // Primary key //
  id: uuid("id").defaultRandom().primaryKey(),

  // Restaurant //
  restaurantId: uuid("restaurant_id").notNull(),

  // Name of the workshop //
  name: text("name").notNull(),

  // Is label printing enabled? //
  isLabelPrintingEnabled: boolean("is_label_printing_enabled")
    .notNull()
    .default(false),

  // Is enabled? //
  isEnabled: boolean("is_enabled").notNull().default(true),

  // Timestamps //
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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

export const workshopWorkers = pgTable("workshop_workers", {
  workerId: uuid("worker_id")
    .notNull()
    .references(() => workers.id),
  workshopId: uuid("workshop_id")
    .notNull()
    .references(() => restaurantWorkshops.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
