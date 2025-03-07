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
  orderFroms: orderFromEnum("order_froms").array().notNull(),
  orderTypes: orderTypeEnum("order_types").array().notNull(),
  daysOfWeek: dayOfWeekEnum("days_of_week").array().notNull(),

  // Advanced conditions //
  promocode: text("promocode"),
  applyByPromocode: boolean("apply_by_promocode").notNull().default(false),
  applyForFirstOrder: boolean("apply_for_first_order").notNull().default(false),
  applyByDefault: boolean("apply_by_default").notNull().default(false),

  // Boolean flags //
  isEnabled: boolean("isEnabled").notNull().default(true),

  // Valid time //
  startHour: integer("start_hour"),
  endHour: integer("end_hour"),
  activeFrom: timestamp("active_from").notNull(),
  activeTo: timestamp("active_to").notNull(),

  // Timestamps //
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type IDiscount = typeof discounts.$inferSelect;

export const discountRelations = relations(discounts, ({ many }) => ({
  discountsToRestaurants: many(discountsToRestaurants),
}));

export const discountsToRestaurants = pgTable(
  "discounts_to_restaurants",
  {
    discountId: uuid("discount_id").notNull(),
    restaurantId: uuid("restaurant_id").notNull(),
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
