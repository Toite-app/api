import { relations } from "drizzle-orm";
import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { sessions } from "./sessions";
import { restaurants } from "./restaurants";

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

export const workers = pgTable("workers", {
  id: uuid("id").defaultRandom(),
  name: text("name"),
  restaurantId: uuid("restaurantId"),
  login: text("login").unique().notNull(),
  role: workerRoleEnum("role").notNull(),
  passwordHash: text("passwordHash").notNull(),
  isBlocked: boolean("isBlocked").default(false),
  hiredAt: timestamp("hiredAt"),
  firedAt: timestamp("firedAt"),
  onlineAt: timestamp("onlineAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const workerRelations = relations(workers, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [workers.restaurantId],
    references: [restaurants.id],
  }),
  sessions: many(sessions, {
    relationName: "sessions",
  }),
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
