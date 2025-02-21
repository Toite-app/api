import { OmitType, PartialType } from "@nestjs/swagger";
import { CreateRestaurantDishModifierDto } from "src/restaurants/dish-modifiers/dto/create-restaurant-dish-modifier.dto";

export class UpdateRestaurantDishModifierDto extends OmitType(
  PartialType(CreateRestaurantDishModifierDto),
  ["restaurantId"] as const,
) {}
