import { orders } from "@postgress-db/schema/orders";
import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const guests = pgTable("guests", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().default(""),
  phone: text("phone").unique().notNull(),
  email: text("email").unique(),
  bonusBalance: integer("bonusBalance").notNull().default(0),
  lastVisitAt: timestamp("lastVisitAt").notNull().defaultNow(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type IGuest = typeof guests.$inferSelect;

export const guestRelations = relations(guests, ({ many }) => ({
  orders: many(orders),
}));
