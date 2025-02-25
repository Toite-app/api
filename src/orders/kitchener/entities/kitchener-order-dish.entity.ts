import { PickType } from "@nestjs/swagger";
import { OrderDishEntity } from "src/orders/@/entities/order-dish.entity";

export class KitchenerOrderDishEntity extends PickType(OrderDishEntity, [
  "id",
  "status",
  "name",
  "quantity",
  "quantityReturned",
  "isAdditional",
]) {}
