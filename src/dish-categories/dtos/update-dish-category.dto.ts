import { PartialType } from "@nestjs/swagger";

import { CreateDishCategoryDto } from "./create-dish-category.dto";

export class UpdateDishCategoryDto extends PartialType(CreateDishCategoryDto) {
  updatedAt?: Date;
}
