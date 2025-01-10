import { PaginationResponseDto } from "@core/dto/pagination-response.entity";
import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { DishCategoryEntity } from "./dish-category.entity";

export class DishCategoriesPaginatedDto extends PaginationResponseDto {
  @Expose()
  @ApiProperty({
    description: "Array of dish categories",
    type: [DishCategoryEntity],
  })
  @Type(() => DishCategoryEntity)
  data: DishCategoryEntity[];
}
