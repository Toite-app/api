import { OmitType } from "@nestjs/swagger";
import { OrderEntity } from "src/orders/@/entities/order.entity";

export class OrderSnapshotEntity extends OmitType(OrderEntity, [
  "orderDishes",
  "restaurantName",
]) {}
