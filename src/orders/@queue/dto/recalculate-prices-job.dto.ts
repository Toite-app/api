import { IsString } from "@i18n-class-validator";

export class RecalculatePricesJobDto {
  @IsString()
  orderId: string;
}
