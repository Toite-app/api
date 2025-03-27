import { Injectable, Logger } from "@nestjs/common";
import { SocketService } from "src/@socket/socket.service";
import {
  GatewayClient,
  SocketEventType,
  SocketRevalidateOrderEvent,
} from "src/@socket/socket.types";
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
  public async handle(orderId: string) {
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
          } satisfies SocketRevalidateOrderEvent,
        });
      }
    });

    await this.socketService.emit(messages);
  }

  public async notifyAboutNewOrder(workerIds: string[]) {
    return;
    // const clients = await this.socketService.getClients();
    // const subscriptions = await this.socketService.getSubscriptions();

    // const clientsMap = new Map<string, GatewayClient>(
    //   clients.map((client) => [client.clientId, client]),
    // );

    // const workerIdsToNotifySet = new Set(workerIds);
    // const clientIdToWorkerIdMap = new Map<string, string>(
    //   clients.map((client) => [client.clientId, client.workerId]),
    // );

    // const messages: {
    //   recipient: GatewayClient;
    //   event: string;
    //   data: any;
    // }[] = [];

    // subscriptions.forEach((subscription) => {
    //   const workerId = clientIdToWorkerIdMap.get(subscription.clientId);

    //   if (!workerId) return;
    //   if (!workerIdsToNotifySet.has(workerId)) return;

    //   if (subscription.type === ClientSubscriptionType.NEW_ORDERS) {
    //     const recipient = clientsMap.get(subscription.clientId);
    //     if (!recipient) return;

    //     messages.push({
    //       recipient,
    //       event: SocketEventType.SUBSCRIPTION_UPDATE,
    //       data: {
    //         id: subscription.id,
    //         type: "NEW_ORDER",
    //       } satisfies SocketNewOrderEvent,
    //     });
    //   }
    // });

    // await this.socketService.emit(messages);
  }
}
