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
  menuId: uuid("menuId"),

  // Name of the dish //
  name: text("name").notNull().default(""),

  // Note that was available only for persons that can update dish //
  note: text("note").notNull().default(""),

  // How much time is needed for cooking //
  cookingTimeInMin: integer("cookingTimeInMin").notNull().default(0),

  // How many pcs in one item (for example: 6 hinkali per one item) //
  amountPerItem: integer("amountPerItem").notNull().default(1),

  // Weight of the dish //
  weight: integer("weight").notNull().default(0),
  weightMeasure: weightMeasureEnum("weightMeasure").notNull().default("grams"),

  // Label printing //
  isLabelPrintingEnabled: boolean("isLabelPrintingEnabled")
    .notNull()
    .default(false),
  printLabelEveryItem: integer("printLabelEveryItem").notNull().default(0),

  // Publishing booleans //
  isPublishedInApp: boolean("isPublishedInApp").notNull().default(false),
  isPublishedAtSite: boolean("isPublishedAtSite").notNull().default(false),

  // Default timestamps //
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type IDish = typeof dishes.$inferSelect;

export const dishesToRestaurants = pgTable(
  "dishesToRestaurants",
  {
    dishId: uuid("dishId").notNull(),
    restaurantId: uuid("restaurantId").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0"),
    currency: currencyEnum("currency").notNull().default("EUR"),
    isInStopList: boolean("isInStopList").notNull().default(false),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
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
  "dishesToWorkshops",
  {
    dishId: uuid("dishId").notNull(),
    workshopId: uuid("workshopId").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
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
