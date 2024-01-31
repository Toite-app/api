import { ApiProperty, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { IRestaurantHours } from "@postgress-db/schema";
import { Expose } from "class-transformer";
import {
  IsBoolean,
  IsISO8601,
  IsNumberString,
  IsString,
} from "class-validator";

export class RestaurantHoursDto implements IRestaurantHours {
  @IsNumberString()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the restaurant hours",
    example: 1,
  })
  id: number;

  @IsNumberString()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the restaurant",
    example: 1,
  })
  restaurantId: number;

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
