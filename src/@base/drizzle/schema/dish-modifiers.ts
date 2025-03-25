import { orderDishes } from "@postgress-db/schema/order-dishes";
import { restaurants } from "@postgress-db/schema/restaurants";
import { relations } from "drizzle-orm";
import {
  boolean,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const dishModifiers = pgTable("dish_modifiers", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Modifier data //
  name: text("name").notNull(),

  // Modifiers should be linked to a restaurant //
  restaurantId: uuid("restaurant_id").notNull(),

  // Boolean fields //
  isActive: boolean("is_active").notNull().default(true),
  isRemoved: boolean("is_removed").notNull().default(false),

  // Default timestamps //
  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  removedAt: timestamp("removed_at", {
    withTimezone: true,
  }),
});

export type IDishModifier = typeof dishModifiers.$inferSelect;

export const dishModifiersToOrderDishes = pgTable(
  "dish_modifiers_to_order_dishes",
  {
    dishModifierId: uuid("dish_modifier_id").notNull(),
    orderDishId: uuid("order_dish_id").notNull(),
  },
  (t) => [primaryKey({ columns: [t.dishModifierId, t.orderDishId] })],
);

export type IDishModifiersToOrderDishes =
  typeof dishModifiersToOrderDishes.$inferSelect;

export const dishModifiersToOrderDishesRelations = relations(
  dishModifiersToOrderDishes,
  ({ one }) => ({
    dishModifier: one(dishModifiers, {
      fields: [dishModifiersToOrderDishes.dishModifierId],
      references: [dishModifiers.id],
    }),
    orderDish: one(orderDishes, {
      fields: [dishModifiersToOrderDishes.orderDishId],
      references: [orderDishes.id],
    }),
  }),
);

export const dishModifierRelations = relations(
  dishModifiers,
  ({ one, many }) => ({
    restaurant: one(restaurants, {
      fields: [dishModifiers.restaurantId],
      references: [restaurants.id],
    }),
    dishModifiersToOrderDishes: many(dishModifiersToOrderDishes),
  }),
);
