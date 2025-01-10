import { PaginationResponseDto } from "@core/dto/pagination-response.entity";
import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { DishEntity } from "./dish.entity";

export class DishesPaginatedDto extends PaginationResponseDto {
  @Expose()
  @ApiProperty({
    description: "Array of dishes",
    type: [DishEntity],
  })
  @Type(() => DishEntity)
  data: DishEntity[];
}
