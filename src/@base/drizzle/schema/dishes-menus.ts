import { dishes } from "@postgress-db/schema/dishes";
import { restaurants } from "@postgress-db/schema/restaurants";
import { workers } from "@postgress-db/schema/workers";
import { relations } from "drizzle-orm";
import {
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const dishesMenus = pgTable("dishesMenu", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Name of the menu with dishes //
  name: text("name").notNull().default(""),

  // Owner of the menu //
  ownerId: uuid("ownerId").notNull(),

  // Default timestamps //
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type IDishesMenu = typeof dishesMenus.$inferSelect;

export const dishesMenusToRestaurants = pgTable(
  "dishesMenusToRestaurants",
  {
    restaurantId: uuid("restaurantId").notNull(),
    dishesMenuId: uuid("dishesMenuId").notNull(),
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
  owner: one(workers, {
    fields: [dishesMenus.ownerId],
    references: [workers.id],
  }),
}));
