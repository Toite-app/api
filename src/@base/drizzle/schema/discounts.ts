import { dayOfWeekEnum } from "@postgress-db/schema/general";
import { orderFromEnum, orderTypeEnum } from "@postgress-db/schema/orders";
import { restaurants } from "@postgress-db/schema/restaurants";
import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const discounts = pgTable("discounts", {
  // Primary key //
  id: uuid("id").defaultRandom().primaryKey(),

  // Name of the discount //
  name: text("name").notNull(),

  // Description of the discount //
  description: text("description").default(""),

  // Info //
  percent: integer("percent").notNull().default(0),

  // Basic conditions //
  orderFroms: orderFromEnum("orderFroms").array().notNull(),
  orderTypes: orderTypeEnum("orderTypes").array().notNull(),
  daysOfWeek: dayOfWeekEnum("daysOfWeek").array().notNull(),

  // Advanced conditions //
  promocode: text("promocode"),
  applyByPromocode: boolean("applyByPromocode").notNull().default(false),
  applyForFirstOrder: boolean("applyForFirstOrder").notNull().default(false),
  applyByDefault: boolean("applyByDefault").notNull().default(false),

  // Boolean flags //
  isEnabled: boolean("isEnabled").notNull().default(true),

  // Valid time //
  startHour: integer("startHour"),
  endHour: integer("endHour"),
  activeFrom: timestamp("activeFrom").notNull(),
  activeTo: timestamp("activeTo").notNull(),

  // Timestamps //
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type IDiscount = typeof discounts.$inferSelect;

export const discountRelations = relations(discounts, ({ many }) => ({
  discountsToRestaurants: many(discountsToRestaurants),
}));

export const discountsToRestaurants = pgTable(
  "discountsToRestaurants",
  {
    discountId: uuid("discountId").notNull(),
    restaurantId: uuid("restaurantId").notNull(),
  },
  (t) => [
    primaryKey({
      columns: [t.discountId, t.restaurantId],
    }),
  ],
);

export const discountToRestaurantRelations = relations(
  discountsToRestaurants,
  ({ one }) => ({
    discount: one(discounts, {
      fields: [discountsToRestaurants.discountId],
      references: [discounts.id],
    }),
    restaurant: one(restaurants, {
      fields: [discountsToRestaurants.restaurantId],
      references: [restaurants.id],
    }),
  }),
);
