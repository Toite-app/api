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

export const paymentMethodTypeEnum = pgEnum("paymentMethodType", [
  "YOO_KASSA",
  "CUSTOM",
]);

export const paymentMethodIconEnum = pgEnum("paymentMethodIcon", [
  "YOO_KASSA",
  "CASH",
  "CARD",
]);

export type IPaymentMethodType =
  (typeof paymentMethodTypeEnum.enumValues)[number];

export const paymentMethods = pgTable("paymentMethods", {
  id: uuid("id").defaultRandom().primaryKey(),

  // For example "Yoo Kassa" or "Cash"/"Card" //
  name: text("name").notNull(),
  type: paymentMethodTypeEnum("type").notNull(),
  icon: paymentMethodIconEnum("icon").notNull(),

  restaurantId: uuid("restaurantId").notNull(),

  // For YOO_KASSA //
  secretId: text("secretId"),
  secretKey: text("secretKey"),

  // Boolean fields //
  isActive: boolean("isActive").notNull().default(false),
  isRemoved: boolean("isRemoved").notNull().default(false),

  // Default timestamps //
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  removedAt: timestamp("removedAt"),
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
