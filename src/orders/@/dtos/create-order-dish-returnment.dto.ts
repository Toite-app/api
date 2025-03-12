import { PickType } from "@nestjs/swagger";
import { OrderDishReturnmentEntity } from "src/orders/@/entities/order-dish-returnment";

export class CreateOrderDishReturnmentDto extends PickType(
  OrderDishReturnmentEntity,
  ["quantity", "reason"],
) {}
