import { IntersectionType, PartialType, PickType } from "@nestjs/swagger";

import { DishEntity } from "../entities/dish.entity";

export class CreateDishDto extends IntersectionType(
  PickType(DishEntity, ["name", "cookingTimeInMin", "weight", "weightMeasure"]),
  PartialType(
    PickType(DishEntity, [
      "note",
      "amountPerItem",
      "isLabelPrintingEnabled",
      "printLabelEveryItem",
      "isPublishedInApp",
      "isPublishedAtSite",
    ]),
  ),
) {}
