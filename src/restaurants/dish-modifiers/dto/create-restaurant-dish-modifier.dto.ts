import { OmitType } from "@nestjs/swagger";
import { RestaurantDishModifierEntity } from "src/restaurants/dish-modifiers/entities/restaurant-dish-modifier.entity";

export class CreateRestaurantDishModifierDto extends OmitType(
  RestaurantDishModifierEntity,
  ["id", "createdAt", "updatedAt", "removedAt"] as const,
) {}
