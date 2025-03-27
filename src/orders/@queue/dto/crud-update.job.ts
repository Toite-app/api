import { OrderDishEntity } from "src/orders/@/entities/order-dish.entity";

export class OrderCrudUpdateJobDto {
  orderId: string;
}

export class OrderDishCrudUpdateJobDto {
  orderDish: Omit<OrderDishEntity, "modifiers">;
}
