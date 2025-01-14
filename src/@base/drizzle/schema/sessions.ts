import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { workers } from "./workers";

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  previousId: uuid("previousId"),
  workerId: uuid("workerId").notNull(),
  httpAgent: text("httpAgent"),
  ip: text("ip"),
  isActive: boolean("isActive").notNull().default(true),
  onlineAt: timestamp("onlineAt").notNull().defaultNow(),
  refreshedAt: timestamp("refreshedAt").notNull().defaultNow(),
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
