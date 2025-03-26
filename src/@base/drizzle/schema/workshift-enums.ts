import { pgEnum } from "drizzle-orm/pg-core";
import { z } from "zod";

export const workshiftPaymentTypeEnum = pgEnum("workshift_payment_type", [
  "INCOME",
  "EXPENSE",
  "CASHLESS",
]);

export const ZodWorkshiftPaymentType = z.enum(
  workshiftPaymentTypeEnum.enumValues,
);

export enum WorkshiftPaymentType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
  CASHLESS = "CASHLESS",
}
