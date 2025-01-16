import { pgEnum } from "drizzle-orm/pg-core";

export const dayOfWeekEnum = pgEnum("day_of_week", [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export const currencyEnum = pgEnum("currency", ["EUR", "USD", "RUB"]);

export type ICurrency = (typeof currencyEnum.enumValues)[number];
