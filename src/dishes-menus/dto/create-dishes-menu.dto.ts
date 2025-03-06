import { IsArray, IsUUID } from "@i18n-class-validator";
import {
  ApiProperty,
  IntersectionType,
  PartialType,
  PickType,
} from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { DishesMenuEntity } from "src/dishes-menus/entity/dishes-menu.entity";

export class CreateDishesMenuDto extends IntersectionType(
  PickType(DishesMenuEntity, ["name"]),
  PartialType(PickType(DishesMenuEntity, ["ownerId"])),
) {
  @Expose()
  @IsArray()
  @IsUUID(undefined, { each: true })
  @ApiProperty({
    description: "Restaurants that have this menu",
    example: ["d290f1ee-6c54-4b01-90e6-d701748f0851"],
  })
  restaurantIds: string[];
}
