import { Injectable, Logger } from "@nestjs/common";
import { IRole } from "@postgress-db/schema/workers";
import { SocketService } from "src/@socket/socket.service";
import { ConnectedClient, ConnectedClients } from "src/@socket/socket.types";
import { OrderEntity } from "src/orders/@/entities/order.entity";

type workerId = string;

@Injectable()
export class OrdersSocketNotifier {
  private readonly logger = new Logger(OrdersSocketNotifier.name);

  constructor(private readonly socketService: SocketService) {}

  private makeWorkersByRoleMap(clients: ConnectedClients) {
    const workersByRoleMap: Record<
      IRole,
      Record<workerId, Omit<ConnectedClient, "socket" | "clientId">>
    > = {
      SYSTEM_ADMIN: {},
      CHIEF_ADMIN: {},
      ADMIN: {},
      KITCHENER: {},
      WAITER: {},
      CASHIER: {},
      DISPATCHER: {},
      COURIER: {},
    };

    Object.entries(clients).forEach(([, clientObject]) => {
      // WTF user connected with no clients?
      if (Object.keys(clientObject).length === 0) {
        return;
      }

      const [, client] = Object.entries(clientObject)[0];

      const { worker, session } = client;

      if (!workersByRoleMap?.[worker.role]) {
        workersByRoleMap[worker.role] = {};
      }

      // if worker already exists, skip
      if (!!workersByRoleMap[worker.role]?.[worker.id]) {
        return;
      }

      workersByRoleMap[worker.role][worker.id] = {
        worker,
        session,
      };
    });

    return workersByRoleMap;
  }

  /**
   * ! WE SHOULD NOTIFY USERS ONLY IF ORDER HAVE CHANGED DATA
   * ! (needs to be implemented before calling that method)
   * @param order
   */
  public async handle(order: OrderEntity) {
    const clients = this.socketService.getClients();
    const workersByRoleMap = this.makeWorkersByRoleMap(clients);
  }
}
