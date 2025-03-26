import { IsDate, IsEnum, IsString, IsUUID } from "@i18n-class-validator";
import { ApiProperty, PickType } from "@nestjs/swagger";
import { ZodCurrency, ZodLocaleEnum } from "@postgress-db/schema/general";
import { ZodOrderTypeEnum } from "@postgress-db/schema/order-enums";
import { IOrderPrecheck } from "@postgress-db/schema/order-prechecks";
import { Expose, Type } from "class-transformer";
import { OrderEntity } from "src/orders/@/entities/order.entity";
import { WorkerEntity } from "src/workers/entities/worker.entity";

import { OrderPrecheckPositionEntity } from "./order-precheck-position.entity";

export class OrderPrecheckWorkerEntity extends PickType(WorkerEntity, [
  "name",
  "role",
]) {}

export class OrderPrecheckIncludedOrderEntity extends PickType(OrderEntity, [
  "number",
]) {}

export class OrderPrecheckEntity implements IOrderPrecheck {
  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the precheck",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  id: string;

  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Order identifier",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  orderId: string;

  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Worker identifier who performed the precheck",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  workerId: string;

  @IsEnum(ZodOrderTypeEnum.Enum)
  @Expose()
  @ApiProperty({
    description: "Order type",
    enum: ZodOrderTypeEnum.Enum,
    example: "hall",
  })
  type: typeof ZodOrderTypeEnum._type;

  @IsString()
  @Expose()
  @ApiProperty({
    description: "Legal entity",
    example: "Restaurant LLC",
  })
  legalEntity: string;

  @IsEnum(ZodLocaleEnum.Enum)
  @Expose()
  @ApiProperty({
    description: "Locale",
    enum: ZodLocaleEnum.Enum,
    example: "en",
  })
  locale: typeof ZodLocaleEnum._type;

  @IsEnum(ZodCurrency.Enum)
  @Expose()
  @ApiProperty({
    description: "Currency",
    enum: ZodCurrency.Enum,
  })
  currency: typeof ZodCurrency._type;

  @IsDate()
  @Expose()
  @ApiProperty({
    description: "Creation timestamp",
    example: new Date(),
  })
  createdAt: Date;

  @IsDate()
  @Expose()
  @ApiProperty({
    description: "Last update timestamp",
    example: new Date(),
  })
  updatedAt: Date;

  @Expose()
  @ApiProperty({
    description: "Precheck positions",
    type: [OrderPrecheckPositionEntity],
  })
  @Type(() => OrderPrecheckPositionEntity)
  positions: OrderPrecheckPositionEntity[];

  @Expose()
  @ApiProperty({
    description: "Precheck worker",
    type: OrderPrecheckWorkerEntity,
  })
  @Type(() => OrderPrecheckWorkerEntity)
  worker: OrderPrecheckWorkerEntity;

  @Expose()
  @ApiProperty({
    description: "Precheck order",
    type: OrderPrecheckIncludedOrderEntity,
  })
  @Type(() => OrderPrecheckIncludedOrderEntity)
  order: OrderPrecheckIncludedOrderEntity;
}
