import { restaurants } from "@postgress-db/schema/restaurants";
import {
  workshiftPayments,
  workshiftPaymentTypeEnum,
} from "@postgress-db/schema/workshift-payments";
import { relations } from "drizzle-orm";
import {
  boolean,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const workshiftPaymentCategories = pgTable(
  "workshift_payment_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parentId: uuid("parent_id"),
    restaurantId: uuid("restaurant_id").notNull(),
    type: workshiftPaymentTypeEnum("type").notNull(),

    // Category info //
    name: text("name").notNull(),
    description: text("description"),
    sortIndex: serial("sort_index").notNull(),

    // Flags //
    isActive: boolean("is_active").notNull().default(true),
    isRemoved: boolean("is_removed").notNull().default(false),

    // timestamps //
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    removedAt: timestamp("removed_at"),
  },
);

export const workshiftPaymentCategoryRelations = relations(
  workshiftPaymentCategories,
  ({ one, many }) => ({
    parent: one(workshiftPaymentCategories, {
      fields: [workshiftPaymentCategories.parentId],
      references: [workshiftPaymentCategories.id],
    }),
    childrens: many(workshiftPaymentCategories),
    restaurant: one(restaurants, {
      fields: [workshiftPaymentCategories.restaurantId],
      references: [restaurants.id],
    }),
    workshiftPayments: many(workshiftPayments),
  }),
);
