import {
  dishesToCategories,
  dishesToImages,
} from "@postgress-db/schema/many-to-many";
import { restaurantWorkshops } from "@postgress-db/schema/restaurant-workshop";
import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";

export const weightMeasureEnum = pgEnum("weightMeasureEnum", [
  "grams",
  "milliliters",
]);

export const ZodWeightMeasureEnum = z.enum(weightMeasureEnum.enumValues);

export type WeightMeasureEnum = typeof ZodWeightMeasureEnum._type;

export const dishes = pgTable("dishes", {
  id: uuid("id").defaultRandom().primaryKey(),

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

export const dishesToWorkshops = pgTable(
  "dishesToWorkshops",
  {
    dishId: uuid("dishId").notNull(),
    workshopId: uuid("workshopId").notNull(),
    price: integer("price").notNull().default(0),
    isInStoplist: boolean("isInStoplist").notNull().default(true),
  },
  (t) => [
    primaryKey({
      columns: [t.dishId, t.workshopId],
    }),
  ],
);

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

export const dishRelations = relations(dishes, ({ many }) => ({
  dishesToCategories: many(dishesToCategories),
  dishesToImages: many(dishesToImages),
  dishesToWorkshops: many(dishesToWorkshops),
}));
