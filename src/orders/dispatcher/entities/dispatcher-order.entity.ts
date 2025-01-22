import { ApiProperty, OmitType } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { OrderEntity } from "src/orders/@/entities/order.entity";
import { DispatcherOrderDishEntity } from "src/orders/dispatcher/entities/dispatcher-order-dish.entity";

export class DispatcherOrderEntity extends OmitType(OrderEntity, [
  "orderDishes",
  "isRemoved",
  "removedAt",
  "isHiddenForGuest",
]) {
  @Expose()
  @ApiProperty({
    description: "Order dishes",
    type: [DispatcherOrderDishEntity],
  })
  @Type(() => DispatcherOrderDishEntity)
  orderDishes: DispatcherOrderDishEntity[];
}
