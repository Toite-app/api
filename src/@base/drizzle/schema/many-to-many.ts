import { dishes } from "@postgress-db/schema/dishes";
import { files } from "@postgress-db/schema/files";
import { relations } from "drizzle-orm";
import { integer, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";

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
