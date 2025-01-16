import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsString,
  IsUUID,
  ValidateNested,
} from "@i18n-class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ICurrency } from "@postgress-db/schema/general";
import { Expose, Type } from "class-transformer";

export interface IDishPricelistWorkshop {
  workshopId: string;
  workshopName: string;
  isActive: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface IDishPricelistItem {
  restaurantId: string;
  restaurantName: string;
  workshops: IDishPricelistWorkshop[];
  price: number;
  currency: ICurrency;
  isInStoplist: boolean;
}

export class DishPricelistWorkshopEntity implements IDishPricelistWorkshop {
  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the workshop",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  workshopId: string;

  @IsString()
  @Expose()
  @ApiProperty({
    description: "Name of the workshop",
    example: "Kitchen",
  })
  workshopName: string;

  @IsBoolean()
  @Expose()
  @ApiProperty({
    description: "Whether the workshop is active for this dish",
    example: true,
  })
  isActive: boolean;

  @Expose()
  @ApiProperty({
    description: "When the workshop was assigned to the dish",
    example: "2024-03-20T12:00:00Z",
    nullable: true,
  })
  createdAt: Date | null;

  @Expose()
  @ApiProperty({
    description: "When the workshop assignment was last updated",
    example: "2024-03-20T12:00:00Z",
    nullable: true,
  })
  updatedAt: Date | null;
}

export default class DishPricelistItemEntity implements IDishPricelistItem {
  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the restaurant",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  restaurantId: string;

  @IsString()
  @Expose()
  @ApiProperty({
    description: "Name of the restaurant",
    example: "My Restaurant",
  })
  restaurantName: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DishPricelistWorkshopEntity)
  @Expose()
  @ApiProperty({
    description: "List of workshops where the dish is available",
    type: [DishPricelistWorkshopEntity],
  })
  workshops: DishPricelistWorkshopEntity[];

  @IsNumber()
  @Expose()
  @ApiProperty({
    description: "Price of the dish",
    example: 1000,
  })
  price: number;

  @IsEnum(["EUR", "USD", "RUB"])
  @Expose()
  @ApiProperty({
    description: "Currency of the price",
    example: "EUR",
    enum: ["EUR", "USD", "RUB"],
  })
  currency: ICurrency;

  @IsBoolean()
  @Expose()
  @ApiProperty({
    description: "Whether the dish is in stoplist",
    example: false,
  })
  isInStoplist: boolean;
}
