import { dishCategories } from "@postgress-db/schema/dish-categories";
import { dishes } from "@postgress-db/schema/dishes";
import { relations } from "drizzle-orm";
import { pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";

// Dishes to dish categories relation //
export const dishesToCategories = pgTable(
  "dishesToCategories",
  {
    dishId: uuid("dishId").notNull(),
    dishCategoryId: uuid("dishCategoryId").notNull(),
  },
  (t) => [
    primaryKey({
      columns: [t.dishId, t.dishCategoryId],
    }),
  ],
);

export const dishesToCategoriesRelations = relations(
  dishesToCategories,
  ({ one }) => ({
    dish: one(dishes, {
      fields: [dishesToCategories.dishId],
      references: [dishes.id],
    }),
    dishCategory: one(dishCategories, {
      fields: [dishesToCategories.dishCategoryId],
      references: [dishCategories.id],
    }),
  }),
);
