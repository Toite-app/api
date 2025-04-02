import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from "@i18n-class-validator";
import { ApiProperty, ApiPropertyOptional, PickType } from "@nestjs/swagger";
import { IDish, ZodWeightMeasureEnum } from "@postgress-db/schema/dishes";
import { Expose, Type } from "class-transformer";
import { DishCategoryEntity } from "src/dish-categories/entities/dish-category.entity";
import { DishImageEntity } from "src/dishes/@/entities/dish-image.entity";

export class DishDishCategoryEntity extends PickType(DishCategoryEntity, [
  "id",
  "name",
]) {}

export class DishEntity implements IDish {
  @Expose()
  @IsUUID()
  @ApiProperty({
    description: "Unique identifier of the dish",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  id: string;

  @Expose()
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({
    description: "Unique identifier of the menu",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  menuId: string | null;

  @Expose()
  @IsString()
  @ApiProperty({
    description: "Name of the dish",
    example: "Chicken Kiev",
  })
  name: string;

  @Expose()
  @IsString()
  @ApiProperty({
    description: "Note for internal use",
    example: "Needs to be prepared 2 hours in advance",
  })
  note: string;

  @Expose()
  @IsNumber()
  @ApiProperty({
    description: "Time needed for cooking in minutes",
    example: 30,
  })
  cookingTimeInMin: number;

  @Expose()
  @IsNumber()
  @ApiProperty({
    description: "Amount of pieces per one item",
    example: 1,
  })
  amountPerItem: number;

  @Expose()
  @IsNumber()
  @ApiProperty({
    description: "Weight of the dish",
    example: 250,
  })
  weight: number;

  @Expose()
  @IsEnum(ZodWeightMeasureEnum.Enum)
  @ApiProperty({
    description: "Weight measure unit",
    enum: ZodWeightMeasureEnum.Enum,
    example: ZodWeightMeasureEnum.Enum.grams,
    examples: Object.values(ZodWeightMeasureEnum.Enum),
  })
  weightMeasure: typeof ZodWeightMeasureEnum._type;

  @Expose()
  @IsBoolean()
  @ApiProperty({
    description: "Whether label printing is enabled for this dish",
    example: true,
  })
  isLabelPrintingEnabled: boolean;

  @Expose()
  @IsNumber()
  @ApiProperty({
    description: "Print label for every N items",
    example: 1,
  })
  printLabelEveryItem: number;

  @Expose()
  @IsBoolean()
  @ApiProperty({
    description: "Whether the dish is published in the app",
    example: true,
  })
  isPublishedInApp: boolean;

  @Expose()
  @IsBoolean()
  @ApiProperty({
    description: "Whether the dish is published on the site",
    example: true,
  })
  isPublishedAtSite: boolean;

  @Expose()
  @ValidateNested()
  @Type(() => DishImageEntity)
  @ApiProperty({
    description: "Images associated with the dish",
    type: [DishImageEntity],
  })
  images: DishImageEntity[];

  @Expose()
  @ValidateNested()
  @Type(() => DishDishCategoryEntity)
  @ApiProperty({
    description: "Categories associated with the dish",
    type: [DishDishCategoryEntity],
  })
  categories: DishDishCategoryEntity[];

  @Expose()
  @IsISO8601()
  @ApiProperty({
    description: "Date when dish was created",
    example: new Date("2021-08-01T00:00:00.000Z"),
    type: Date,
  })
  createdAt: Date;

  @Expose()
  @IsISO8601()
  @ApiProperty({
    description: "Date when dish was last updated",
    example: new Date("2022-03-01T05:20:52.000Z"),
    type: Date,
  })
  updatedAt: Date;
}
