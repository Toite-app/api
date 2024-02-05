import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { workers } from "./workers";
import { relations } from "drizzle-orm";

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom(),
  workerId: uuid("workerId").notNull(),
  httpAgent: text("httpAgent"),
  ipAddress: text("ipAddress"),
  token: text("token").notNull().unique(),
  refreshedAt: timestamp("refreshedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const sessionRelations = relations(sessions, ({ one }) => ({
  worker: one(workers, {
    fields: [sessions.workerId],
    references: [workers.id],
  }),
}));

export type ISession = typeof sessions.$inferSelect;
