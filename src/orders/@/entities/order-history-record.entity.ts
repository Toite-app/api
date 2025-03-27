import { IsEnum, IsISO8601, IsOptional, IsUUID } from "@i18n-class-validator";
import { ApiProperty, ApiPropertyOptional, PickType } from "@nestjs/swagger";
import { ZodOrderHistoryTypeEnum } from "@postgress-db/schema/order-enums";
import { IOrderHistoryRecord } from "@postgress-db/schema/order-history";
import { Expose, Type } from "class-transformer";
import { WorkerEntity } from "src/workers/entities/worker.entity";

export class OrderHistoryRecordWorkerEntity extends PickType(WorkerEntity, [
  "id",
  "name",
  "role",
]) {}

export class OrderHistoryRecordEntity implements IOrderHistoryRecord {
  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the order history record",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  id: string;

  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the order",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  orderId: string;

  @IsOptional()
  @IsUUID()
  @Expose()
  @ApiPropertyOptional({
    description: "Unique identifier of the worker",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  workerId: string | null;

  @Expose()
  @IsOptional()
  @Type(() => OrderHistoryRecordWorkerEntity)
  @ApiPropertyOptional({
    description: "Worker data",
    type: OrderHistoryRecordWorkerEntity,
  })
  worker: OrderHistoryRecordWorkerEntity | null;

  @IsEnum(ZodOrderHistoryTypeEnum.Enum)
  @Expose()
  @ApiProperty({
    description: "Type of the order history record",
    enum: ZodOrderHistoryTypeEnum.Enum,
    example: ZodOrderHistoryTypeEnum.Enum.precheck,
    examples: Object.values(ZodOrderHistoryTypeEnum.Enum),
  })
  type: typeof ZodOrderHistoryTypeEnum._type;

  @IsISO8601()
  @Expose()
  @ApiProperty({
    description: "Date when the order history record was created",
    example: new Date("2021-08-01T00:00:00.000Z"),
  })
  createdAt: Date;
}
