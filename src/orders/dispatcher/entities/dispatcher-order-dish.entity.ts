import { PickType } from "@nestjs/swagger";
import { OrderDishEntity } from "src/orders/@/entities/order-dish.entity";

export class DispatcherOrderDishEntity extends PickType(OrderDishEntity, [
  "status",
]) {}
