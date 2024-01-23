import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { workers } from "./workers";

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey().unique().$type(),
  workerId: serial("workerId")
    .notNull()
    .references(() => workers.id),
  httpAgent: text("httpAgent"),
  ipAddress: text("ipAddress"),
  refreshToken: text("refreshToken").notNull(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});
