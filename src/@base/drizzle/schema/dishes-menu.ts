import { dishes } from "@postgress-db/schema/dishes";
import { workers } from "@postgress-db/schema/workers";
import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const dishesMenu = pgTable("dishesMenu", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Name of the menu with dishes //
  name: text("name").notNull().default(""),

  // Owner of the menu //
  ownerId: uuid("ownerId").notNull(),

  // Default timestamps //
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type IDishMenu = typeof dishesMenu.$inferSelect;

export const dishesMenuRelations = relations(dishesMenu, ({ one, many }) => ({
  dishes: many(dishes),
  owner: one(workers, {
    fields: [dishesMenu.ownerId],
    references: [workers.id],
  }),
}));
