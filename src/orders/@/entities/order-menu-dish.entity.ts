import { IsBoolean, IsDecimal, ValidateNested } from "@i18n-class-validator";
import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
  PickType,
} from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { DishEntity } from "src/dishes/@/entities/dish.entity";
import { OrderDishEntity } from "src/orders/@/entities/order-dish.entity";
import { OrderEntity } from "src/orders/@/entities/order.entity";

export class OrderMenuDishOrderDishEntity extends IntersectionType(
  PickType(OrderDishEntity, ["price", "quantity", "modifiers"]),
  PickType(OrderEntity, ["currency"]),
) {}

export class OrderMenuDishEntity extends IntersectionType(
  PickType(DishEntity, [
    "id",
    "name",
    "images",
    "amountPerItem",
    "cookingTimeInMin",
  ]),
) {
  @Expose()
  @IsBoolean()
  @ApiProperty({
    description: "Whether the dish is in the stop list",
  })
  isInStopList: boolean;

  @Expose()
  @ApiPropertyOptional({
    description: "Order dish",
    type: OrderMenuDishOrderDishEntity,
  })
  @Type(() => OrderMenuDishOrderDishEntity)
  @ValidateNested()
  orderDish: OrderMenuDishOrderDishEntity | null;
}
