import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { workers } from "./workers";
import { sql } from "drizzle-orm";

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey().unique().$type(),
  workerId: serial("workerId")
    .notNull()
    .references(() => workers.id),
  httpAgent: text("httpAgent"),
  ipAddress: text("ipAddress"),
  token: text("token").notNull().unique(),
  refreshedAt: timestamp("refreshedAt"),
  createdAt: timestamp("createdAt")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
