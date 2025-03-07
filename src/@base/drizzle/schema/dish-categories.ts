import { dishesMenus } from "@postgress-db/schema/dishes-menus";
import { dishesToCategories } from "@postgress-db/schema/many-to-many";
import { relations } from "drizzle-orm";
import {
  boolean,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const dishCategories = pgTable("dish_categories", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Category belongs to a menu //
  menuId: uuid("menu_id").notNull(),

  // Name of the category //
  name: text("name").notNull().default(""),

  // Will category be visible for workers //
  showForWorkers: boolean("show_for_workers").notNull().default(false),

  // Will category be visible for guests at site and in app //
  showForGuests: boolean("show_for_guests").notNull().default(false),

  // Sorting index in the admin menu //
  sortIndex: serial("sort_index").notNull(),

  // Default timestamps //
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type IDishCategory = typeof dishCategories.$inferSelect;

export const dishCategoryRelations = relations(
  dishCategories,
  ({ one, many }) => ({
    dishesToCategories: many(dishesToCategories),
    menu: one(dishesMenus, {
      fields: [dishCategories.menuId],
      references: [dishesMenus.id],
    }),
  }),
);
