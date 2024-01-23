import { sql } from "drizzle-orm";
import {
  boolean,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { z } from "zod";

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
  id: serial("id").primaryKey().unique(),
  name: text("name"),
  login: text("login").notNull(),
  role: workerRoleEnum("role").notNull(),
  passwordHash: text("passwordHash").notNull(),
  isBlocked: boolean("isBlocked").default(false),
  hiredAt: timestamp("hiredAt"),
  firedAt: timestamp("firedAt"),
  onlineAt: timestamp("onlineAt"),
  createdAt: timestamp("createdAt")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
