import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const weightMeasureEnum = pgEnum("weightMeasureEnum", [
  "grams",
  "milliliters",
]);

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
