import { Injectable, Logger } from "@nestjs/common";
import { SocketService } from "src/@socket/socket.service";
import {
  GatewayClient,
  SocketEventType,
  SocketNewOrderEvent,
  SocketRevalidateOrderEvent,
} from "src/@socket/socket.types";
import { OrderEntity } from "src/orders/@/entities/order.entity";
import { OrdersService } from "src/orders/@/services/orders.service";

@Injectable()
export class OrdersSocketNotifier {
  private readonly logger = new Logger(OrdersSocketNotifier.name);

  constructor(
    private readonly socketService: SocketService,
    private readonly ordersService: OrdersService,
  ) {}

  /**
   * TODO:
   *
   * ! WE SHOULD NOTIFY USERS ONLY IF ORDER HAVE CHANGED DATA
   * ! (needs to be implemented before calling that method)
   * @param order
   */
  public async handle(orderId: string, fullEntity?: OrderEntity | null) {
    const clients = await this.socketService.getClients();
    const currentPathnames = await this.socketService.getCurrentPathnames();

    const clientsMap = new Map<string, GatewayClient>(
      clients.map((client) => [client.clientId, client]),
    );

    const messages: {
      recipient: GatewayClient;
      event: string;
      data: any;
    }[] = [];

    Object.entries(currentPathnames).forEach(([clientId, pathname]) => {
      if (pathname.includes("/orders") && pathname.includes(orderId)) {
        const recipient = clientsMap.get(clientId);
        if (!recipient) return;

        messages.push({
          recipient,
          event: SocketEventType.REVALIDATE_ORDER,
          data: {
            orderId,
            ...(fullEntity ? { order: fullEntity } : {}),
          } satisfies SocketRevalidateOrderEvent,
        });
      }
    });

    await this.socketService.emit(messages);
  }

  public async notifyAboutNewOrder(workerIds: string[], orderId: string) {
    const workerIdsSet = new Set(workerIds);
    const clients = await this.socketService.getClients();
    const currentPathnames = await this.socketService.getCurrentPathnames();

    const clientsMap = new Map<string, GatewayClient>(
      clients.map((client) => [client.clientId, client]),
    );

    const messages: {
      recipient: GatewayClient;
      event: string;
      data: any;
    }[] = [];

    Object.entries(currentPathnames).forEach(([clientId, pathname]) => {
      const recipient = clientsMap.get(clientId);

      if (!recipient) return;
      if (!workerIdsSet.has(recipient.workerId)) return;

      // if (pathname.endsWith("/orders/dispatcher")) {
      //   messages.push({
      //     recipient,
      //     event: SocketEventType.NEW_ORDER,
      //     data: {
      //       orderId,
      //     } satisfies SocketNewOrderEvent,
      //   });
      // }
    });

    console.log(JSON.stringify(messages, null, 2));
    console.log(JSON.stringify(currentPathnames, null, 2));
    console.log(JSON.stringify(workerIdsSet, null, 2));

    await this.socketService.emit(messages);
  }
}
