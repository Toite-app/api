import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { workers } from "./workers";

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  previousId: uuid("previous_id"),
  workerId: uuid("worker_id").notNull(),
  httpAgent: text("http_agent"),
  ip: text("ip"),
  isActive: boolean("is_active").notNull().default(true),
  onlineAt: timestamp("online_at").notNull().defaultNow(),
  refreshedAt: timestamp("refreshed_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessionRelations = relations(sessions, ({ one }) => ({
  worker: one(workers, {
    fields: [sessions.workerId],
    references: [workers.id],
  }),
}));

export type ISession = typeof sessions.$inferSelect;
