import { CrudAction } from "@core/types/general";
import { OrderDishEntity } from "src/orders/@/entities/order-dish.entity";
import { OrderEntity } from "src/orders/@/entities/order.entity";

export class OrderCrudUpdateJobDto {
  orderId: string;
  order: OrderEntity;
  action: `${CrudAction}`;
  calledByWorkerId?: string;
}

export class OrderDishCrudUpdateJobDto {
  orderDishId: string;
  orderDish: Omit<OrderDishEntity, "modifiers">;
  action: `${CrudAction}`;
  calledByWorkerId?: string;
}
