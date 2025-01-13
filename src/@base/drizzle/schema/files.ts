import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),

  // File group id //
  groupId: uuid("groupId"),

  // Original name of the file //
  originalName: text("originalName").notNull(),

  // Mime type of the file //
  mimeType: text("mimeType").notNull(),

  // Extension of the file //
  extension: text("extension").notNull(),

  // Bucket name //
  bucketName: text("bucketName").notNull(),

  // Region of the file //
  region: text("region").notNull(),

  // Endpoint of the file //
  endpoint: text("endpoint").notNull(),

  // Size of the file in bytes //
  size: integer("size").notNull().default(0),

  // Uploaded by user id //
  uploadedByUserId: uuid("uploadedByUserId"),

  // Created at //
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type IFile = typeof files.$inferSelect;
