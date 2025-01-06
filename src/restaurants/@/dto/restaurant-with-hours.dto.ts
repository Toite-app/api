import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { RestaurantHoursEntity } from "src/restaurants/hours/entities/restaurant-hours.entity";

import { RestaurantEntity } from "../entities/restaurant.entity";

export class RestaurantWithHoursDto extends RestaurantEntity {
  @Expose()
  @ApiProperty({
    description: "Array of restaurant hours",
    type: [RestaurantHoursEntity],
  })
  @Type(() => RestaurantHoursEntity)
  hours: RestaurantHoursEntity[];
}
