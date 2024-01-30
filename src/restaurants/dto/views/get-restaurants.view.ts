import { PaginationResponseDto } from "@core/dto/pagination-response.entity";
import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { RestaurantDto } from "../restaurant.dto";

export class RestaurantsPaginatedDto extends PaginationResponseDto {
  @Expose()
  @ApiProperty({
    description: "Array of restaurants",
    type: [RestaurantDto],
  })
  @Type(() => RestaurantDto)
  data: RestaurantDto[];
}
