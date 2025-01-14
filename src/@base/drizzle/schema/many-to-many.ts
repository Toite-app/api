import { dishCategories } from "@postgress-db/schema/dish-categories";
import { dishes } from "@postgress-db/schema/dishes";
import { files } from "@postgress-db/schema/files";
import { relations } from "drizzle-orm";
import { integer, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";

// ----------------------------------- //
// Dishes to dish categories relation  //
// ----------------------------------- //
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

export type IDishesToCategories = typeof dishesToCategories.$inferSelect;

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

// ----------------------------------- //
// Dishes to images relation           //
// ----------------------------------- //
export const dishesToImages = pgTable(
  "dishesToImages",
  {
    dishId: uuid("dishId").notNull(),
    imageFileId: uuid("imageFileId").notNull(),
    sortIndex: integer("sortIndex").notNull().default(0),
  },
  (t) => [
    primaryKey({
      columns: [t.dishId, t.imageFileId],
    }),
  ],
);

export type IDishesToImages = typeof dishesToImages.$inferSelect;

export const dishesToImagesRelations = relations(dishesToImages, ({ one }) => ({
  dish: one(dishes, {
    fields: [dishesToImages.dishId],
    references: [dishes.id],
  }),
  imageFile: one(files, {
    fields: [dishesToImages.imageFileId],
    references: [files.id],
  }),
}));
