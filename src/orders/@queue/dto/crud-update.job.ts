import { CrudAction } from "@core/types/general";
import { OrderEntity } from "src/orders/@/entities/order.entity";

export class OrderCrudUpdateJobDto {
  orderId: string;
  order: OrderEntity;
  action: `${CrudAction}`;
  calledByWorkerId?: string;
}
