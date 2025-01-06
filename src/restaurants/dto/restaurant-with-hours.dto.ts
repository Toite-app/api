import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { RestaurantDto } from "../entities/restaurant.entity";

import { RestaurantHoursDto } from "./restaurant-hours.dto";

export class RestaurantWithHoursDto extends RestaurantDto {
  @Expose()
  @ApiProperty({
    description: "Array of restaurant hours",
    type: [RestaurantHoursDto],
  })
  @Type(() => RestaurantHoursDto)
  hours: RestaurantHoursDto[];
}
