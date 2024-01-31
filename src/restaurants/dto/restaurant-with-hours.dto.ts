import { Expose, Type } from "class-transformer";
import { RestaurantDto } from "./restaurant.dto";
import { RestaurantHoursDto } from "./restaurant-hours.dto";
import { ApiProperty } from "@nestjs/swagger";

export class RestaurantWithHoursDto extends RestaurantDto {
  @Expose()
  @ApiProperty({
    description: "Array of restaurant hours",
    type: [RestaurantHoursDto],
  })
  @Type(() => RestaurantHoursDto)
  hours: RestaurantHoursDto[];
}
