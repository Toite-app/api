import {
  IsBoolean,
  IsDate,
  IsDecimal,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "@i18n-class-validator";
import { ApiProperty, ApiPropertyOptional, PickType } from "@nestjs/swagger";
import { ZodCurrency } from "@postgress-db/schema/general";
import {
  IWorkshiftPayment,
  ZodWorkshiftPaymentType,
} from "@postgress-db/schema/workshift-payments";
import { Expose, Type } from "class-transformer";
import { WorkshiftPaymentCategoryEntity } from "src/restaurants/workshift-payment-categories/entity/workshift-payment-category.entity";
import { WorkerEntity } from "src/workers/entities/worker.entity";

export class WorkshiftPaymentWorkerEntity extends PickType(WorkerEntity, [
  "id",
  "name",
  "role",
]) {}

export class WorkshiftPaymentIncludedCategoryParentEntity extends PickType(
  WorkshiftPaymentCategoryEntity,
  ["name"],
) {}

export class WorkshiftPaymentIncludedCategoryEntity extends PickType(
  WorkshiftPaymentCategoryEntity,
  ["name", "parentId"],
) {
  @Expose()
  @Type(() => WorkshiftPaymentIncludedCategoryParentEntity)
  @ApiPropertyOptional({
    description: "Parent category of the payment",
    type: WorkshiftPaymentIncludedCategoryParentEntity,
  })
  parent: WorkshiftPaymentIncludedCategoryParentEntity | null;
}

export class WorkshiftPaymentEntity implements IWorkshiftPayment {
  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the payment",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  id: string;

  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Category ID of the payment",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  categoryId: string;

  @Expose()
  @Type(() => WorkshiftPaymentIncludedCategoryEntity)
  @ApiProperty({
    description: "Category of the payment",
    type: WorkshiftPaymentIncludedCategoryEntity,
  })
  category: WorkshiftPaymentIncludedCategoryEntity;

  @IsEnum(ZodWorkshiftPaymentType.Enum)
  @Expose()
  @ApiProperty({
    description: "Type of the payment",
    enum: ZodWorkshiftPaymentType.Enum,
    example: ZodWorkshiftPaymentType.Enum.INCOME,
    examples: Object.values(ZodWorkshiftPaymentType.Enum),
  })
  type: typeof ZodWorkshiftPaymentType._type;

  @IsOptional()
  @IsString()
  @Expose()
  @MaxLength(255)
  @ApiPropertyOptional({
    description: "Note for the payment",
    example: "Payment for extra hours",
  })
  note: string | null;

  @IsDecimal()
  @Expose()
  @ApiProperty({
    description: "Amount of the payment",
    example: "150.00",
  })
  amount: string;

  @IsString()
  @Expose()
  @ApiProperty({
    description: "Currency of the payment",
    example: ZodCurrency.Enum.USD,
    enum: ZodCurrency.Enum,
    examples: Object.values(ZodCurrency.Enum),
  })
  currency: typeof ZodCurrency._type;

  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "ID of the workshift",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  workshiftId: string;

  @IsOptional()
  @IsUUID()
  @Expose()
  @ApiPropertyOptional({
    description: "ID of the worker",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  workerId: string | null;

  @Expose()
  @IsOptional()
  @Type(() => WorkshiftPaymentWorkerEntity)
  @ApiPropertyOptional({
    description: "Worker who created the payment",
    type: WorkshiftPaymentWorkerEntity,
  })
  worker: WorkshiftPaymentWorkerEntity | null;

  @IsOptional()
  @IsUUID()
  @Expose()
  @ApiPropertyOptional({
    description: "ID of the worker who removed the payment",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  removedByWorkerId: string | null;

  @Expose()
  @IsOptional()
  @Type(() => WorkshiftPaymentWorkerEntity)
  @ApiPropertyOptional({
    description: "Worker who removed the payment",
    type: WorkshiftPaymentWorkerEntity,
  })
  removedByWorker: WorkshiftPaymentWorkerEntity | null;

  @IsBoolean()
  @Expose()
  @ApiProperty({
    description: "Whether the payment is removed",
    example: false,
  })
  isRemoved: boolean;

  @IsDate()
  @Expose()
  @ApiProperty({
    description: "Date when payment was created",
    example: new Date("2021-08-01T00:00:00.000Z"),
    type: Date,
  })
  createdAt: Date;

  @IsDate()
  @Expose()
  @ApiProperty({
    description: "Date when payment was last updated",
    example: new Date("2021-08-01T00:00:00.000Z"),
    type: Date,
  })
  updatedAt: Date;

  @IsOptional()
  @IsDate()
  @Expose()
  @ApiPropertyOptional({
    description: "Date when payment was removed",
    example: new Date("2021-08-01T00:00:00.000Z"),
    type: Date,
  })
  removedAt: Date | null;
}
