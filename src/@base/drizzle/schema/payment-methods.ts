import { orders } from "@postgress-db/schema/orders";
import { restaurants } from "@postgress-db/schema/restaurants";
import { relations } from "drizzle-orm";
import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const paymentMethodTypeEnum = pgEnum("payment_method_type", [
  "YOO_KASSA",
  "CUSTOM",
]);

export const paymentMethodIconEnum = pgEnum("payment_method_icon", [
  "YOO_KASSA",
  "CASH",
  "CARD",
]);

export type IPaymentMethodType =
  (typeof paymentMethodTypeEnum.enumValues)[number];

export const paymentMethods = pgTable("payment_methods", {
  id: uuid("id").defaultRandom().primaryKey(),

  // For example "Yoo Kassa" or "Cash"/"Card" //
  name: text("name").notNull(),
  type: paymentMethodTypeEnum("type").notNull(),
  icon: paymentMethodIconEnum("icon").notNull(),

  restaurantId: uuid("restaurant_id").notNull(),

  // For YOO_KASSA //
  secretId: text("secret_id"),
  secretKey: text("secret_key"),

  // Boolean fields //
  isActive: boolean("is_active").notNull().default(false),
  isRemoved: boolean("is_removed").notNull().default(false),

  // Default timestamps //
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  removedAt: timestamp("removed_at"),
});

export type IPaymentMethod = typeof paymentMethods.$inferSelect;

export const paymentMethodRelations = relations(
  paymentMethods,
  ({ one, many }) => ({
    orders: many(orders),
    restaurant: one(restaurants, {
      fields: [paymentMethods.restaurantId],
      references: [restaurants.id],
    }),
  }),
);
