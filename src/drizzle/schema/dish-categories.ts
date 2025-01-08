import { dishesToCategories } from "@postgress-db/schema/many-to-many";
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const dishCategories = pgTable("dishCategories", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Name of the category //
  name: text("name").notNull().default(""),

  // Will category be visible for workers //
  showForWorkers: boolean("showForWorkers").notNull().default(false),

  // Will category be visible for guests at site and in app //
  showForGuests: boolean("showForGuests").notNull().default(false),

  // Sorting index in the admin menu //
  sortIndex: integer("sortIndex")
    .notNull()
    .default(
      sql`nextval(pg_get_serial_sequence('dishCategories', 'sortIndex'))`,
    ),

  // Default timestamps //
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type IDishCategory = typeof dishCategories.$inferSelect;

export const dishCategoryRelations = relations(dishCategories, ({ many }) => ({
  dishesToCategories: many(dishesToCategories),
}));
