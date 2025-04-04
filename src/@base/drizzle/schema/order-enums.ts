import { pgEnum } from "drizzle-orm/pg-core";
import { z } from "zod";

export const orderTypeEnum = pgEnum("order_type_enum", [
  "hall",
  "banquet",
  "takeaway",
  "delivery",
]);

export const ZodOrderTypeEnum = z.enum(orderTypeEnum.enumValues);

export type OrderTypeEnum = typeof ZodOrderTypeEnum._type;

export const orderFromEnum = pgEnum("order_from_enum", [
  "app",
  "website",
  "internal",
]);

export const ZodOrderFromEnum = z.enum(orderFromEnum.enumValues);

export type OrderFromEnum = typeof ZodOrderFromEnum._type;

export const orderStatusEnum = pgEnum("order_status_enum", [
  "pending",
  "cooking",
  "ready",
  "delivering",
  "paid",
  "completed",
  "cancelled",
]);

export const ZodOrderStatusEnum = z.enum(orderStatusEnum.enumValues);

export type OrderStatusEnum = typeof ZodOrderStatusEnum._type;

export const orderHistoryTypeEnum = pgEnum("order_history_type_enum", [
  "created",
  "precheck",
  "sent_to_kitchen",
  "dishes_ready",
  "discounts_enabled",
  "discounts_disabled",
]);

export const ZodOrderHistoryTypeEnum = z.enum(orderHistoryTypeEnum.enumValues);
