import { dishCategories } from "@postgress-db/schema/dish-categories";
import { dishesMenus } from "@postgress-db/schema/dishes-menus";
import { dayOfWeekEnum } from "@postgress-db/schema/general";
import { guests } from "@postgress-db/schema/guests";
import { orderFromEnum, orderTypeEnum } from "@postgress-db/schema/order-enums";
import { orders } from "@postgress-db/schema/orders";
import { restaurants } from "@postgress-db/schema/restaurants";
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  time,
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
  applyOnlyByPromocode: boolean("apply_only_by_promocode")
    .notNull()
    .default(false),
  applyOnlyAtFirstOrder: boolean("apply_only_at_first_order")
    .notNull()
    .default(false),

  // Boolean flags //
  isEnabled: boolean("is_enabled").notNull().default(true),

  // Valid time //
  startTime: time("start_time", { withTimezone: false }),
  endTime: time("end_time", { withTimezone: false }),
  activeFrom: timestamp("active_from", {
    withTimezone: true,
  }).notNull(),
  activeTo: timestamp("active_to", {
    withTimezone: true,
  }).notNull(),

  // Timestamps //
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

export type IDiscount = typeof discounts.$inferSelect;

export const discountRelations = relations(discounts, ({ many }) => ({
  connections: many(discountsConnections),
  discountsToOrders: many(discountsToOrders),
  discountsToGuests: many(discountsToGuests),
}));

export const discountsConnections = pgTable(
  "discount_connections",
  {
    discountId: uuid("discount_id").notNull(),
    dishesMenuId: uuid("dishes_menu_id").notNull(),
    restaurantId: uuid("restaurant_id").notNull(),
    dishCategoryId: uuid("dish_category_id").notNull(),
  },
  (t) => [
    primaryKey({
      columns: [t.discountId, t.dishesMenuId, t.restaurantId, t.dishCategoryId],
    }),
    index("discount_connections_discount_id_idx").on(t.discountId),
    index("discount_connections_dishes_menu_id_idx").on(t.dishesMenuId),
    index("discount_connections_restaurant_id_idx").on(t.restaurantId),
    index("discount_connections_dish_category_id_idx").on(t.dishCategoryId),
  ],
);

export type IDiscountConnection = typeof discountsConnections.$inferSelect;

export const discountConnectionsRelations = relations(
  discountsConnections,
  ({ one }) => ({
    discount: one(discounts, {
      fields: [discountsConnections.discountId],
      references: [discounts.id],
    }),
    dishesMenu: one(dishesMenus, {
      fields: [discountsConnections.dishesMenuId],
      references: [dishesMenus.id],
    }),
    restaurant: one(restaurants, {
      fields: [discountsConnections.restaurantId],
      references: [restaurants.id],
    }),
    dishCategory: one(dishCategories, {
      fields: [discountsConnections.dishCategoryId],
      references: [dishCategories.id],
    }),
  }),
);

export const discountsToOrders = pgTable(
  "discounts_to_orders",
  {
    discountId: uuid("discount_id").notNull(),
    orderId: uuid("order_id").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.discountId, t.orderId] }),
    index("discounts_to_orders_order_id_idx").on(t.orderId),
  ],
);

export type IDiscountToOrder = typeof discountsToOrders.$inferSelect;

export const discountToOrderRelations = relations(
  discountsToOrders,
  ({ one }) => ({
    discount: one(discounts, {
      fields: [discountsToOrders.discountId],
      references: [discounts.id],
    }),
    order: one(orders, {
      fields: [discountsToOrders.orderId],
      references: [orders.id],
    }),
  }),
);

export const discountsToGuests = pgTable(
  "discounts_to_guests",
  {
    discountId: uuid("discount_id").notNull(),
    guestId: uuid("guest_id").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.discountId, t.guestId] }),
    index("discounts_to_guests_guest_id_idx").on(t.guestId),
  ],
);

export type IDiscountToGuest = typeof discountsToGuests.$inferSelect;

export const discountToGuestRelations = relations(
  discountsToGuests,
  ({ one }) => ({
    discount: one(discounts, {
      fields: [discountsToGuests.discountId],
      references: [discounts.id],
    }),
    guest: one(guests, {
      fields: [discountsToGuests.guestId],
      references: [guests.id],
    }),
  }),
);
