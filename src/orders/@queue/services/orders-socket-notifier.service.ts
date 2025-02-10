import { Injectable, Logger } from "@nestjs/common";
import { plainToClass } from "class-transformer";
import { SocketService } from "src/@socket/socket.service";
import { GatewayWorker } from "src/@socket/socket.types";
import { OrderEntity } from "src/orders/@/entities/order.entity";

export enum OrderSocketEvents {
  SUBSCRIPTION_UPDATED = "subscription:update",
}

@Injectable()
export class OrdersSocketNotifier {
  private readonly logger = new Logger(OrdersSocketNotifier.name);

  constructor(private readonly socketService: SocketService) {}

  /**
   * ! WE SHOULD NOTIFY USERS ONLY IF ORDER HAVE CHANGED DATA
   * ! (needs to be implemented before calling that method)
   * @param order
   */
  public async handle(order: OrderEntity) {
    const workers = await this.socketService.getWorkers();
    const subscriptions = await this.socketService.getSubscriptions();

    const orderSubscriptions = subscriptions.filter((subscription) => {
      return (
        subscription.type === "ORDER" && subscription.data.orderId === order.id
      );
    });

    const clientIds = orderSubscriptions.map(
      (subscription) => subscription.clientId,
    );

    await this.socketService.emitTo(
      {
        clientIds,
        workerIds: undefined,
      },
      OrderSocketEvents.SUBSCRIPTION_UPDATED,
      {
        type: "ORDER",
      },
    );
  }
}
