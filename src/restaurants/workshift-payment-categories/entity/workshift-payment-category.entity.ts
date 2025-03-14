import {
  IsBoolean,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
} from "@i18n-class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ZodWorkshiftPaymentType } from "@postgress-db/schema/workshift-payments";
import { Expose } from "class-transformer";

export class WorkshiftPaymentCategoryEntity {
  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the workshift payment category",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  id: string;

  @IsUUID()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional({
    description: "Parent category ID",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  parentId: string | null;

  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Restaurant ID this category belongs to",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  restaurantId: string;

  @IsString()
  @Expose()
  @ApiProperty({
    description: "Type of the payment category",
    enum: ZodWorkshiftPaymentType.Enum,
    example: ZodWorkshiftPaymentType.Enum.INCOME,
    examples: Object.values(ZodWorkshiftPaymentType.Enum),
  })
  type: typeof ZodWorkshiftPaymentType._type;

  @IsString()
  @Expose()
  @ApiProperty({
    description: "Name of the payment category",
    example: "Tips",
  })
  name: string;

  @IsString()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional({
    description: "Description of the payment category",
    example: "Tips from customers",
  })
  description: string | null;

  @Expose()
  @ApiProperty({
    description: "Sort index for ordering",
    example: 1,
  })
  sortIndex: number;

  @IsBoolean()
  @Expose()
  @ApiProperty({
    description: "Whether the category is active",
    example: true,
  })
  isActive: boolean;

  @IsBoolean()
  @Expose()
  @ApiProperty({
    description: "Whether the category is removed",
    example: false,
  })
  isRemoved: boolean;

  @IsISO8601()
  @Expose()
  @ApiProperty({
    description: "Date when category was created",
    example: new Date("2021-08-01T00:00:00.000Z"),
    type: Date,
  })
  createdAt: Date;

  @IsISO8601()
  @Expose()
  @ApiProperty({
    description: "Date when category was last updated",
    example: new Date("2021-08-01T00:00:00.000Z"),
    type: Date,
  })
  updatedAt: Date;

  @IsISO8601()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional({
    description: "Date when category was removed",
    example: null,
    type: Date,
  })
  removedAt: Date | null;
}
