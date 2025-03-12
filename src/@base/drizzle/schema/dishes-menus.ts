import { dishCategories } from "@postgress-db/schema/dish-categories";
import { dishes } from "@postgress-db/schema/dishes";
import { restaurants } from "@postgress-db/schema/restaurants";
import { workers } from "@postgress-db/schema/workers";
import { relations } from "drizzle-orm";
import {
  boolean,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const dishesMenus = pgTable("dishes_menus", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Name of the menu with dishes //
  name: text("name").notNull().default(""),

  // Owner of the menu //
  ownerId: uuid("owner_id").notNull(),

  // Boolean flags //
  isRemoved: boolean("is_removed").notNull().default(false),

  // Default timestamps //
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  removedAt: timestamp("removed_at"),
});

export type IDishesMenu = typeof dishesMenus.$inferSelect;

export const dishesMenusToRestaurants = pgTable(
  "dishes_menus_to_restaurants",
  {
    restaurantId: uuid("restaurant_id").notNull(),
    dishesMenuId: uuid("dishes_menu_id").notNull(),
  },
  (t) => [
    primaryKey({
      columns: [t.restaurantId, t.dishesMenuId],
    }),
  ],
);

export const dishesMenusToRestaurantsRelations = relations(
  dishesMenusToRestaurants,
  ({ one }) => ({
    restaurant: one(restaurants, {
      fields: [dishesMenusToRestaurants.restaurantId],
      references: [restaurants.id],
    }),
    dishesMenu: one(dishesMenus, {
      fields: [dishesMenusToRestaurants.dishesMenuId],
      references: [dishesMenus.id],
    }),
  }),
);

export const dishesMenusRelations = relations(dishesMenus, ({ one, many }) => ({
  dishes: many(dishes),
  dishesMenusToRestaurants: many(dishesMenusToRestaurants),
  dishCategories: many(dishCategories),
  owner: one(workers, {
    fields: [dishesMenus.ownerId],
    references: [workers.id],
  }),
}));
