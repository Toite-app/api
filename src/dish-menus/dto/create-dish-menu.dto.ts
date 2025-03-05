import { IntersectionType, PartialType, PickType } from "@nestjs/swagger";
import { DishMenuEntity } from "src/dish-menus/entity/dish-menu.entity";

export class CreateDishMenuDto extends IntersectionType(
  PickType(DishMenuEntity, ["name"]),
  PartialType(PickType(DishMenuEntity, ["ownerId"])),
) {}
