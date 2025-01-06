import { PaginationResponseDto } from "@core/dto/pagination-response.entity";
import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { RestaurantEntity } from "../../entities/restaurant.entity";

export class RestaurantsPaginatedDto extends PaginationResponseDto {
  @Expose()
  @ApiProperty({
    description: "Array of restaurants",
    type: [RestaurantEntity],
  })
  @Type(() => RestaurantEntity)
  data: RestaurantEntity[];
}
