import { orderDeliveries } from "@postgress-db/schema/order-deliveries";
import { restaurants } from "@postgress-db/schema/restaurants";
import { relations } from "drizzle-orm";
import {
  boolean,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";

import { workshopWorkers } from "./restaurant-workshop";
import { sessions } from "./sessions";

export const workerRoleEnum = pgEnum("workerRoleEnum", [
  "SYSTEM_ADMIN" as const,
  "CHIEF_ADMIN",
  "ADMIN",
  "KITCHENER",
  "WAITER",
  "CASHIER",
  "DISPATCHER",
  "COURIER",
]);

export const ZodWorkerRole = z.enum(workerRoleEnum.enumValues);

export type IRole = (typeof workerRoleEnum.enumValues)[number];

export const workers = pgTable("workers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().default("N/A"),
  login: text("login").unique().notNull(),
  role: workerRoleEnum("role").notNull(),
  passwordHash: text("passwordHash").notNull(),
  isBlocked: boolean("isBlocked").notNull().default(false),
  hiredAt: timestamp("hiredAt"),
  firedAt: timestamp("firedAt"),
  onlineAt: timestamp("onlineAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const workersToRestaurants = pgTable(
  "workersToRestaurants",
  {
    workerId: uuid("workerId").notNull(),
    restaurantId: uuid("restaurantId").notNull(),
  },
  (t) => [
    primaryKey({
      columns: [t.workerId, t.restaurantId],
    }),
  ],
);

export type IWorkersToRestaurants = typeof workersToRestaurants.$inferSelect;

export const workersToRestaurantsRelations = relations(
  workersToRestaurants,
  ({ one }) => ({
    worker: one(workers, {
      fields: [workersToRestaurants.workerId],
      references: [workers.id],
    }),
    restaurant: one(restaurants, {
      fields: [workersToRestaurants.restaurantId],
      references: [restaurants.id],
    }),
  }),
);

export const workerRelations = relations(workers, ({ many }) => ({
  workersToRestaurants: many(workersToRestaurants),
  sessions: many(sessions),
  workshops: many(workshopWorkers),
  deliveries: many(orderDeliveries),
}));

export type IWorker = typeof workers.$inferSelect;
export type WorkerRole = typeof ZodWorkerRole._type;

export const workerRoleRank: Record<WorkerRole, number> = {
  KITCHENER: 0,
  WAITER: 0,
  CASHIER: 0,
  DISPATCHER: 0,
  COURIER: 0,
  ADMIN: 1,
  CHIEF_ADMIN: 2,
  SYSTEM_ADMIN: 3,
};
