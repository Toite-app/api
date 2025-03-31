import { Inject, Injectable, Logger } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { SocketService } from "src/@socket/socket.service";
import {
  GatewayClient,
  SocketEventType,
  SocketRevalidateOrderEvent,
} from "src/@socket/socket.types";
import { PG_CONNECTION } from "src/constants";

@Injectable()
export class OrdersSocketNotifier {
  private readonly logger = new Logger(OrdersSocketNotifier.name);

  constructor(
    @Inject(PG_CONNECTION)
    private readonly pg: NodePgDatabase<typeof schema>,
    private readonly socketService: SocketService,
  ) {}

  private async _getOrderRelatedClients(orderId: string) {
    // We should return only clients that are related somehow to the order
    // For example: SYSTEM_ADMIN, CHIEF_ADMIN will be always notifies
    // And for example OWNER will be notified only if he owns restaurant

    const order = await this.pg.query.orders.findFirst({
      where: (orders, { and, eq }) =>
        and(
          eq(orders.id, orderId),
          eq(orders.isRemoved, false),
          eq(orders.isArchived, false),
        ),
      columns: {},
      with: {
        restaurant: {
          columns: {},
          with: {
            owner: {
              columns: {
                id: true,
              },
            },
            workersToRestaurants: {
              columns: {
                workerId: true,
              },
            },
          },
        },
      },
    });

    const alwaysWorkers = await this.pg.query.workers.findMany({
      where: (workers, { eq, and, inArray }) =>
        and(
          eq(workers.isBlocked, false),
          inArray(workers.role, ["SYSTEM_ADMIN", "CHIEF_ADMIN", "DISPATCHER"]),
        ),
      columns: {
        id: true,
      },
    });

    // Ids of workers that related to the order
    const orderWorkerIdsSet = new Set();

    if (order) {
      if (order.restaurant?.owner?.id) {
        orderWorkerIdsSet.add(order.restaurant.owner.id);
      }

      if (order.restaurant?.workersToRestaurants) {
        order.restaurant.workersToRestaurants.forEach((workerToRestaurant) => {
          orderWorkerIdsSet.add(workerToRestaurant.workerId);
        });
      }
    }

    if (alwaysWorkers) {
      alwaysWorkers.forEach((worker) => {
        orderWorkerIdsSet.add(worker.id);
      });
    }

    const clients = await this.socketService.getClients();

    return clients.filter((client) => {
      return orderWorkerIdsSet.has(client.workerId);
    });
  }

  /**
   * ! WE SHOULD NOTIFY USERS ONLY IF ORDER HAVE CHANGED DATA
   * ! (needs to be implemented before calling that method)
   * @param orderId
   */
  public async handleUpdate(orderId: string) {
    const recipients = await this._getOrderRelatedClients(orderId);
    const pathnames = await this.socketService.getCurrentPathnames();

    const clientIdToPathnameMap = new Map<string, string>(
      Object.entries(pathnames).map(([clientId, pathname]) => [
        clientId,
        pathname,
      ]),
    );

    const messages: {
      recipient: GatewayClient;
      event: SocketEventType;
      data: any;
    }[] = [];

    recipients.forEach((recipient) => {
      const pathname = clientIdToPathnameMap.get(recipient.clientId);

      if (!pathname) return;

      if (pathname.includes("/orders") && pathname.includes(orderId)) {
        messages.push({
          recipient,
          event: SocketEventType.REVALIDATE_ORDER_PAGE,
          data: {
            orderId,
          } satisfies SocketRevalidateOrderEvent,
        });
      } else if (pathname.endsWith("/orders/dispatcher")) {
        messages.push({
          recipient,
          event: SocketEventType.REVALIDATE_DISPATCHER_ORDERS_PAGE,
          data: null,
        });
      } else if (pathname.endsWith("/orders/kitchen")) {
        messages.push({
          recipient,
          event: SocketEventType.REVALIDATE_KITCHENER_ORDERS_PAGE,
          data: null,
        });
      }
    });

    await this.socketService.emit(messages);
  }

  public async handleCreation(orderId: string) {
    const recipients = await this._getOrderRelatedClients(orderId);
    const pathnames = await this.socketService.getCurrentPathnames();

    const clientIdToPathnameMap = new Map<string, string>(
      Object.entries(pathnames).map(([clientId, pathname]) => [
        clientId,
        pathname,
      ]),
    );

    const messages: {
      recipient: GatewayClient;
      event: SocketEventType;
      data: any;
    }[] = [];

    recipients.forEach((recipient) => {
      const pathname = clientIdToPathnameMap.get(recipient.clientId);

      if (!pathname) return;

      if (pathname.endsWith("/orders/dispatcher")) {
        messages.push({
          recipient,
          event: SocketEventType.REVALIDATE_DISPATCHER_ORDERS_PAGE,
          data: null,
        });
      }
    });

    await this.socketService.emit(messages);
  }
}
