import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  MinLength,
} from "@i18n-class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IDiscount } from "@postgress-db/schema/discounts";
import { ZodDayOfWeekEnum } from "@postgress-db/schema/general";
import {
  ZodOrderFromEnum,
  ZodOrderTypeEnum,
} from "@postgress-db/schema/order-enums";
import { Expose, Type } from "class-transformer";
import { i18nValidationMessage } from "nestjs-i18n";
import { DishesMenuEntity } from "src/dishes-menus/entity/dishes-menu.entity";

export class DiscountConnectionEntity {
  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the menu",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  dishesMenuId: string;

  @Expose()
  @Type(() => DishesMenuEntity)
  @ApiProperty({
    description: "Dishes menu that was assigned to the discount",
    type: DishesMenuEntity,
  })
  dishesMenu: DishesMenuEntity;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @Expose()
  @ApiProperty({
    description: "Restaurant IDs that were assigned to the discount",
    type: String,
    isArray: true,
  })
  restaurantIds: string[];

  @IsArray()
  @IsUUID(undefined, { each: true })
  @Expose()
  @ApiProperty({
    description: "Dish category IDs that were assigned to the discount",
    type: String,
    isArray: true,
  })
  dishCategoryIds: string[];
}

export class DiscountEntity implements IDiscount {
  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the discount",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  id: string;

  @IsString()
  @MinLength(2)
  @Expose()
  @ApiProperty({
    description: "Name of the discount",
    example: "Happy Hour",
  })
  name: string;

  @IsOptional()
  @IsString()
  @Expose()
  @ApiPropertyOptional({
    description: "Description of the discount",
    example: "20% off during happy hours",
  })
  description: string | null;

  @IsNumber()
  @Min(0)
  @Max(100)
  @Expose()
  @ApiProperty({
    description: "Percent of the discount",
    example: 20,
  })
  percent: number;

  @IsArray()
  @IsEnum(ZodOrderFromEnum.Enum, { each: true })
  @Expose()
  @ApiProperty({
    description: "Order sources where discount is applicable",
    enum: ZodOrderFromEnum.Enum,
    isArray: true,
  })
  orderFroms: (typeof ZodOrderFromEnum._type)[];

  @IsArray()
  @IsEnum(ZodOrderTypeEnum.Enum, { each: true })
  @Expose()
  @ApiProperty({
    description: "Order types where discount is applicable",
    enum: ZodOrderTypeEnum.Enum,
    isArray: true,
  })
  orderTypes: (typeof ZodOrderTypeEnum._type)[];

  @IsArray()
  @IsEnum(ZodDayOfWeekEnum.Enum, { each: true })
  @Expose()
  @ApiProperty({
    description: "Days of week when discount is active",
    enum: ZodDayOfWeekEnum.Enum,
    isArray: true,
  })
  daysOfWeek: (typeof ZodDayOfWeekEnum._type)[];

  @IsOptional()
  @IsString()
  @Expose()
  @ApiPropertyOptional({
    description: "Promocode for the discount",
    example: "HAPPY20",
  })
  promocode: string | null;

  @IsBoolean()
  @Expose()
  @ApiProperty({
    description: "Whether discount applies only to first order",
    example: false,
  })
  applyOnlyAtFirstOrder: boolean;

  @IsBoolean()
  @Expose()
  @ApiProperty({
    description: "Whether discount is applied by promocode",
    example: true,
  })
  applyOnlyByPromocode: boolean;

  @IsBoolean()
  @Expose()
  @ApiProperty({
    description: "Whether discount is enabled",
    example: true,
  })
  isEnabled: boolean;

  @IsOptional()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: i18nValidationMessage("validation.time.invalid_format"),
  })
  @IsString()
  @Expose()
  @ApiPropertyOptional({
    description: "Start time in HH:MM or HH:MM:SS format",
    example: "14:00",
  })
  startTime: string | null;

  @IsOptional()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: i18nValidationMessage("validation.time.invalid_format"),
  })
  @IsString()
  @Expose()
  @ApiPropertyOptional({
    description: "End time in HH:MM or HH:MM:SS format",
    example: "18:00",
  })
  endTime: string | null;

  @IsISO8601()
  @Expose()
  @ApiProperty({
    description: "Start date of the discount validity",
    example: new Date("2024-01-01T00:00:00.000Z"),
  })
  activeFrom: Date;

  @IsISO8601()
  @Expose()
  @ApiProperty({
    description: "End date of the discount validity",
    example: new Date("2024-12-31T23:59:59.999Z"),
  })
  activeTo: Date;

  @IsDate()
  @Expose()
  @ApiProperty({
    description: "Timestamp when discount was created",
    example: new Date("2024-01-01T00:00:00.000Z"),
  })
  createdAt: Date;

  @IsDate()
  @Expose()
  @ApiProperty({
    description: "Timestamp when discount was last updated",
    example: new Date("2024-01-01T00:00:00.000Z"),
  })
  updatedAt: Date;
}

export class DiscountFullEntity extends DiscountEntity {
  @IsArray()
  @Expose()
  @Type(() => DiscountConnectionEntity)
  @ApiProperty({
    description: "Connections that was assigned to the discount",
    type: [DiscountConnectionEntity],
  })
  connections: DiscountConnectionEntity[];
}
