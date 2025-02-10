import { Injectable, Logger } from "@nestjs/common";
import { plainToClass } from "class-transformer";
import { SocketService } from "src/@socket/socket.service";
import {
  GatewayClient,
  SocketEventType,
  SocketOrderUpdateEvent,
} from "src/@socket/socket.types";
import { OrderEntity } from "src/orders/@/entities/order.entity";

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
    const clients = await this.socketService.getClients();
    const subscriptions = await this.socketService.getSubscriptions();

    const clientsMap = new Map<string, GatewayClient>(
      clients.map((client) => [client.clientId, client]),
    );

    const messages: {
      recipient: GatewayClient;
      event: string;
      data: any;
    }[] = [];

    subscriptions.forEach((subscription) => {
      if (
        subscription.type === "ORDER" &&
        subscription.data.orderId === order.id
      ) {
        const recipient = clientsMap.get(subscription.clientId);
        if (!recipient) return;

        messages.push({
          recipient,
          event: SocketEventType.SUBSCRIPTION_UPDATE,
          data: {
            id: subscription.id,
            type: "ORDER",
            order: plainToClass(OrderEntity, order, {
              excludeExtraneousValues: true,
            }),
          } satisfies SocketOrderUpdateEvent,
        });
      }
    });

    await this.socketService.emit(messages);
  }
}
