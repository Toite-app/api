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

export const dishModifiers = pgTable("dishModifiers", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Modifier data //
  name: text("name").notNull(),

  // Modifiers should be linked to a restaurant //
  restaurantId: uuid("restaurantId").notNull(),

  // Boolean fields //
  isActive: boolean("isActive").notNull().default(true),
  isRemoved: boolean("isRemoved").notNull().default(false),

  // Default timestamps //
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  removedAt: timestamp("removedAt"),
});

export type IDishModifier = typeof dishModifiers.$inferSelect;

export const dishModifiersToOrderDishes = pgTable(
  "dishModifiersToOrderDishes",
  {
    dishModifierId: uuid("dishModifierId").notNull(),
    orderDishId: uuid("orderDishId").notNull(),
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
