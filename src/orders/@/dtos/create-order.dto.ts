import { IntersectionType, PartialType, PickType } from "@nestjs/swagger";
import { OrderEntity } from "src/orders/@/entities/order.entity";

export class CreateOrderDto extends IntersectionType(
  PickType(OrderEntity, ["type"]),
  PartialType(
    PickType(OrderEntity, [
      "tableNumber",
      "restaurantId",
      "note",
      "guestName",
      "guestPhone",
      "guestsAmount",
      "delayedTo",
      "paymentMethodId",
    ]),
  ),
) {}
