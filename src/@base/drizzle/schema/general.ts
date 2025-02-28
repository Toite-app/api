import { pgEnum } from "drizzle-orm/pg-core";
import { z } from "zod";

export const dayOfWeekEnum = pgEnum("day_of_week", [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export const ZodDayOfWeekEnum = z.enum(dayOfWeekEnum.enumValues);

export const currencyEnum = pgEnum("currency", ["EUR", "USD", "RUB"]);

export const ZodCurrency = z.enum(currencyEnum.enumValues);

export type ZodCurrencyEnum = typeof ZodCurrency._type;

export type ICurrency = (typeof currencyEnum.enumValues)[number];
