import { dishesToImages } from "@postgress-db/schema/many-to-many";
import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),

  // File group id //
  groupId: uuid("group_id"),

  // Original name of the file //
  originalName: text("original_name").notNull(),

  // Mime type of the file //
  mimeType: text("mime_type").notNull(),

  // Extension of the file //
  extension: text("extension").notNull(),

  // Bucket name //
  bucketName: text("bucket_name").notNull(),

  // Region of the file //
  region: text("region").notNull(),

  // Endpoint of the file //
  endpoint: text("endpoint").notNull(),

  // Size of the file in bytes //
  size: integer("size").notNull().default(0),

  // Uploaded by user id //
  uploadedByUserId: uuid("uploaded_by_user_id"),

  // Created at //
  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

export type IFile = typeof files.$inferSelect;

export const fileRelations = relations(files, ({ many }) => ({
  dishesToImages: many(dishesToImages),
}));
