import { IsUUID } from "@i18n-class-validator";
import {
  ApiProperty,
  IntersectionType,
  PartialType,
  PickType,
} from "@nestjs/swagger";
import { Expose } from "class-transformer";

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
) {
  @Expose()
  @IsUUID()
  @ApiProperty({
    description: "Unique identifier of the menu",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  menuId: string;

  @Expose()
  @IsUUID(undefined, { each: true })
  @ApiProperty({
    description: "Unique identifier of the dish category",
    example: ["d290f1ee-6c54-4b01-90e6-d701748f0851"],
  })
  categoryIds: string[];
}
