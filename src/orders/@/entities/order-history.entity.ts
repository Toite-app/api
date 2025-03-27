import { IsOptional } from "@i18n-class-validator";
import { ApiPropertyOptional, OmitType } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { OrderHistoryRecordEntity } from "src/orders/@/entities/order-history-record.entity";
import { OrderPrecheckEntity } from "src/orders/@/entities/order-precheck.entity";

export class OrderHistoryEntity extends OmitType(OrderHistoryRecordEntity, [
  "orderId",
]) {
  @Expose()
  @IsOptional()
  @Type(() => OrderPrecheckEntity)
  @ApiPropertyOptional({
    description: "Precheck data",
    type: OrderPrecheckEntity,
  })
  precheck: OrderPrecheckEntity | null;
}
