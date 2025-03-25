import { dishesMenus } from "@postgress-db/schema/dishes-menus";
import { orderDeliveries } from "@postgress-db/schema/order-deliveries";
import { orderDishesReturnments } from "@postgress-db/schema/order-dishes";
import { restaurants } from "@postgress-db/schema/restaurants";
import { workshiftPayments } from "@postgress-db/schema/workshift-payments";
import {
  workersToWorkshifts,
  workshifts,
} from "@postgress-db/schema/workshifts";
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

export const workerRoleEnum = pgEnum("worker_role_enum", [
  "SYSTEM_ADMIN" as const,
  "CHIEF_ADMIN",
  "OWNER",
  "ADMIN",
  "KITCHENER",
  "WAITER",
  "CASHIER",
  "DISPATCHER",
  "COURIER",
]);

export const ZodWorkerRole = z.enum(workerRoleEnum.enumValues);

export type IRole = (typeof workerRoleEnum.enumValues)[number];
export enum IRoleEnum {
  SYSTEM_ADMIN = "SYSTEM_ADMIN",
  CHIEF_ADMIN = "CHIEF_ADMIN",
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  KITCHENER = "KITCHENER",
  WAITER = "WAITER",
  CASHIER = "CASHIER",
}

export const workers = pgTable("workers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().default("N/A"),
  login: text("login").unique().notNull(),
  role: workerRoleEnum("role").notNull(),
  passwordHash: text("password_hash").notNull(),
  isBlocked: boolean("is_blocked").notNull().default(false),
  hiredAt: timestamp("hired_at", { withTimezone: true }),
  firedAt: timestamp("fired_at", { withTimezone: true }),
  onlineAt: timestamp("online_at", { withTimezone: true }),
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
});

export const workersToRestaurants = pgTable(
  "workers_to_restaurants",
  {
    workerId: uuid("worker_id").notNull(),
    restaurantId: uuid("restaurant_id").notNull(),
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
  workshopWorkers: many(workshopWorkers),
  deliveries: many(orderDeliveries),
  ownedRestaurants: many(restaurants),
  ownedDishesMenus: many(dishesMenus),
  workshiftsOpened: many(workshifts, {
    relationName: "workshiftsOpened",
  }),
  workshiftsClosed: many(workshifts, {
    relationName: "workshiftsClosed",
  }),
  workersToWorkshifts: many(workersToWorkshifts),
  workshiftPayments: many(workshiftPayments, {
    relationName: "workshiftPaymentsWorker",
  }),
  removedWorkshiftPayments: many(workshiftPayments, {
    relationName: "workshiftPaymentsRemovedByWorker",
  }),
  orderDishesReturnments: many(orderDishesReturnments),
}));

export type IWorker = typeof workers.$inferSelect;
export type WorkerRole = typeof ZodWorkerRole._type;

export const workerRoleRank: Record<WorkerRole, number> = {
  KITCHENER: 0,
  OWNER: 0,
  WAITER: 0,
  CASHIER: 0,
  DISPATCHER: 0,
  COURIER: 0,
  ADMIN: 1,
  CHIEF_ADMIN: 2,
  SYSTEM_ADMIN: 3,
};
