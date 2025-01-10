import { IntersectionType, PartialType, PickType } from "@nestjs/swagger";

import { DishCategoryEntity } from "../entities/dish-category.entity";

export class CreateDishCategoryDto extends IntersectionType(
  PickType(DishCategoryEntity, ["name"]),
  PartialType(
    PickType(DishCategoryEntity, [
      "showForWorkers",
      "showForGuests",
      "sortIndex",
    ]),
  ),
) {}
