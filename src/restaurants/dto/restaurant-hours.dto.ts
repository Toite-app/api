import { ApiProperty, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { IRestaurantHours } from "@postgress-db/schema/restaurants";
import { Expose } from "class-transformer";
import { IsBoolean, IsISO8601, IsString, IsUUID } from "class-validator";

export class RestaurantHoursDto implements IRestaurantHours {
  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the restaurant hours",
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
    description: "Day of the week for hours",
    example: "Monday",
  })
  dayOfWeek: string;

  @IsString()
  @Expose()
  @ApiProperty({
    description: "Opening time for hours",
    example: "10:00",
  })
  openingTime: string;

  @IsString()
  @Expose()
  @ApiProperty({
    description: "Closing time for hours",
    example: "22:00",
  })
  closingTime: string;

  @IsBoolean()
  @Expose()
  @ApiProperty({
    description: "Is the restaurant enabled?",
    example: true,
  })
  isEnabled: boolean;

  @IsISO8601()
  @Expose()
  @ApiProperty({
    description: "Timestamp of creation",
    example: "2020-01-01T00:00:00.000Z",
  })
  createdAt: Date;

  @IsISO8601()
  @Expose()
  @ApiProperty({
    description: "Timestamp of last update",
    example: "2020-01-01T00:00:00.000Z",
  })
  updatedAt: Date;
}

export class CreateRestaurantHoursDto extends PickType(RestaurantHoursDto, [
  "restaurantId",
  "dayOfWeek",
  "openingTime",
  "closingTime",
  "isEnabled",
] as const) {}

export class UpdateRestaurantHoursDto extends OmitType(
  PartialType(CreateRestaurantHoursDto),
  ["restaurantId"] as const,
) {}
