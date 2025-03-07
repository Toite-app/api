import { dishCategories } from "@postgress-db/schema/dish-categories";
import { dishes } from "@postgress-db/schema/dishes";
import { files } from "@postgress-db/schema/files";
import { relations } from "drizzle-orm";
import { integer, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";

// ----------------------------------- //
// Dishes to dish categories relation  //
// ----------------------------------- //
export const dishesToCategories = pgTable(
  "dishes_to_categories",
  {
    dishId: uuid("dish_id").notNull(),
    dishCategoryId: uuid("dish_category_id").notNull(),
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
  "dishes_to_images",
  {
    dishId: uuid("dish_id").notNull(),
    imageFileId: uuid("image_file_id").notNull(),
    alt: text("alt").notNull().default(""),
    sortIndex: integer("sort_index").notNull().default(0),
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
