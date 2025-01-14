import { IsTimeFormat } from "@core/decorators/is-time-format.decorator";
import { DayOfWeek, DayOfWeekEnum } from "@core/types/general";
import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsString,
  IsUUID,
} from "@i18n-class-validator";
import { ApiProperty, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { IRestaurantHours } from "@postgress-db/schema/restaurants";
import { Expose } from "class-transformer";

export class RestaurantHoursEntity implements IRestaurantHours {
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

  @IsEnum(Object.values(DayOfWeekEnum))
  @Expose()
  @ApiProperty({
    description: "Day of the week for hours",
    example: "monday",
    enum: Object.values(DayOfWeekEnum),
  })
  dayOfWeek: DayOfWeek;

  @IsString()
  @IsTimeFormat()
  @Expose()
  @ApiProperty({
    description: "Opening time for hours (24-hour format)",
    example: "10:00",
    pattern: "^([01]\\d|2[0-3]):([0-5]\\d)$",
  })
  openingTime: string;

  @IsString()
  @IsTimeFormat()
  @Expose()
  @ApiProperty({
    description: "Closing time for hours (24-hour format)",
    example: "22:00",
    pattern: "^([01]\\d|2[0-3]):([0-5]\\d)$",
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

export class CreateRestaurantHoursDto extends PickType(RestaurantHoursEntity, [
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
