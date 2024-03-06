import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { RestaurantHoursDto } from "./restaurant-hours.dto";
import { RestaurantDto } from "./restaurant.dto";

export class RestaurantWithHoursDto extends RestaurantDto {
  @Expose()
  @ApiProperty({
    description: "Array of restaurant hours",
    type: [RestaurantHoursDto],
  })
  @Type(() => RestaurantHoursDto)
  hours: RestaurantHoursDto[];
}
