import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { workers } from "./workers";

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey().unique().$type(),
  workerId: serial("workerId")
    .notNull()
    .references(() => workers.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  httpAgent: text("httpAgent"),
  ipAddress: text("ipAddress"),
  token: text("token").notNull().unique(),
  refreshedAt: timestamp("refreshedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type ISession = typeof sessions.$inferSelect;
