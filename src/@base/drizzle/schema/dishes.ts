import { dishesMenus } from "@postgress-db/schema/dishes-menus";
import { currencyEnum } from "@postgress-db/schema/general";
import {
  dishesToCategories,
  dishesToImages,
} from "@postgress-db/schema/many-to-many";
import { orderDishes } from "@postgress-db/schema/order-dishes";
import { restaurantWorkshops } from "@postgress-db/schema/restaurant-workshop";
import { restaurants } from "@postgress-db/schema/restaurants";
import { relations } from "drizzle-orm";
import {
  boolean,
  decimal,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";

export const weightMeasureEnum = pgEnum("weight_measure_enum", [
  "grams",
  "milliliters",
]);

export const ZodWeightMeasureEnum = z.enum(weightMeasureEnum.enumValues);

export type WeightMeasureEnum = typeof ZodWeightMeasureEnum._type;

export const dishes = pgTable("dishes", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Menu //
  menuId: uuid("menu_id"),

  // Name of the dish //
  name: text("name").notNull().default(""),

  // Note that was available only for persons that can update dish //
  note: text("note").notNull().default(""),

  // How much time is needed for cooking //
  cookingTimeInMin: integer("cooking_time_in_min").notNull().default(0),

  // How many pcs in one item (for example: 6 hinkali per one item) //
  amountPerItem: integer("amount_per_item").notNull().default(1),

  // Weight of the dish //
  weight: integer("weight").notNull().default(0),
  weightMeasure: weightMeasureEnum("weight_measure").notNull().default("grams"),

  // Label printing //
  isLabelPrintingEnabled: boolean("is_label_printing_enabled")
    .notNull()
    .default(false),
  printLabelEveryItem: integer("print_label_every_item").notNull().default(0),

  // Publishing booleans //
  isPublishedInApp: boolean("is_published_in_app").notNull().default(false),
  isPublishedAtSite: boolean("is_published_at_site").notNull().default(false),

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
});

export type IDish = typeof dishes.$inferSelect;

export const dishesToRestaurants = pgTable(
  "dishes_to_restaurants",
  {
    dishId: uuid("dish_id").notNull(),
    restaurantId: uuid("restaurant_id").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0"),
    currency: currencyEnum("currency").notNull().default("EUR"),
    isInStopList: boolean("is_in_stop_list").notNull().default(false),
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
  },
  (t) => [
    primaryKey({
      columns: [t.dishId, t.restaurantId],
    }),
  ],
);

export type IDishToRestaurant = typeof dishesToRestaurants.$inferSelect;

export const dishesToRestaurantsRelations = relations(
  dishesToRestaurants,
  ({ one }) => ({
    dish: one(dishes, {
      fields: [dishesToRestaurants.dishId],
      references: [dishes.id],
    }),
    restaurant: one(restaurants, {
      fields: [dishesToRestaurants.restaurantId],
      references: [restaurants.id],
    }),
  }),
);

export const dishesToWorkshops = pgTable(
  "dishes_to_workshops",
  {
    dishId: uuid("dish_id").notNull(),
    workshopId: uuid("workshop_id").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({
      columns: [t.dishId, t.workshopId],
    }),
  ],
);

export type IDishToWorkshop = typeof dishesToWorkshops.$inferSelect;

export const dishesToWorkshopsRelations = relations(
  dishesToWorkshops,
  ({ one }) => ({
    dish: one(dishes, {
      fields: [dishesToWorkshops.dishId],
      references: [dishes.id],
    }),
    workshop: one(restaurantWorkshops, {
      fields: [dishesToWorkshops.workshopId],
      references: [restaurantWorkshops.id],
    }),
  }),
);

export const dishRelations = relations(dishes, ({ one, many }) => ({
  dishesToCategories: many(dishesToCategories),
  dishesToImages: many(dishesToImages),
  dishesToWorkshops: many(dishesToWorkshops),
  dishesToRestaurants: many(dishesToRestaurants),
  orderDishes: many(orderDishes),
  menu: one(dishesMenus, {
    fields: [dishes.menuId],
    references: [dishesMenus.id],
  }),
}));
