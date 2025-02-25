import { ApiProperty, PickType } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { OrderEntity } from "src/orders/@/entities/order.entity";
import { KitchenerOrderDishEntity } from "src/orders/kitchener/entities/kitchener-order-dish.entity";

export class KitchenerOrderEntity extends PickType(OrderEntity, [
  "id",
  "number",
  "tableNumber",
  "from",
  "type",
  "note",
  "guestsAmount",
  "createdAt",
  "updatedAt",
  "delayedTo",
]) {
  @Expose()
  @ApiProperty({
    description: "Order dishes",
    type: [KitchenerOrderDishEntity],
  })
  @Type(() => KitchenerOrderDishEntity)
  orderDishes: KitchenerOrderDishEntity[];
}
