import { IsBoolean, IsISO8601, IsString, IsUUID } from "@i18n-class-validator";
import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { IRestaurantWorkshop } from "@postgress-db/schema/restaurant-workshop";
import { Expose } from "class-transformer";

export class RestaurantWorkshopDto implements IRestaurantWorkshop {
  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the workshop",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  id: string;

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
    description: "Name of the workshop",
    example: "Kitchen Workshop",
  })
  name: string;

  @IsBoolean()
  @Expose()
  @ApiProperty({
    description: "Is label printing enabled for this workshop",
    example: true,
  })
  isLabelPrintingEnabled: boolean;

  @IsBoolean()
  @Expose()
  @ApiProperty({
    description: "Is workshop enabled",
    example: true,
  })
  isEnabled: boolean;

  @IsISO8601()
  @Expose()
  @ApiProperty({
    description: "Timestamp when workshop was created",
    example: "2021-01-01T00:00:00.000Z",
  })
  createdAt: Date;

  @IsISO8601()
  @Expose()
  @ApiProperty({
    description: "Timestamp when workshop was updated",
    example: "2021-01-01T00:00:00.000Z",
  })
  updatedAt: Date;
}

export class CreateRestaurantWorkshopDto extends OmitType(
  RestaurantWorkshopDto,
  ["id", "createdAt", "updatedAt"] as const,
) {}

export class UpdateRestaurantWorkshopDto extends PartialType(
  OmitType(CreateRestaurantWorkshopDto, ["restaurantId"] as const),
) {}
