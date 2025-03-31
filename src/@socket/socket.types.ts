import { IWorker, IWorkersToRestaurants } from "@postgress-db/schema/workers";
import { OrderEntity } from "src/orders/@/entities/order.entity";

export enum GatewayIncomingMessage {
  CURRENT_PATHNAME = "CURRENT_PATHNAME",
}

export interface GatewayClient {
  currentPathname?: string;
  clientId: string;
  gatewayId: string;
  workerId: string;
  connectedAt: Date;
}

export type GatewayClients = GatewayClient[];

export type GatewayWorker = Pick<IWorker, "role" | "id"> & {
  restaurants: Pick<IWorkersToRestaurants, "restaurantId">[];
  connectedAt: Date;
};

export type GatewayMessage = {
  clientId: string;
  event: string;
  data: any;
};

export type SocketEmitTo =
  | {
      clientIds: string[];
      workerIds: undefined;
    }
  | {
      clientIds: undefined;
      workerIds: string[];
    };

export enum SocketEventType {
  REVALIDATE_ORDER = "revalidate-order",
}

export type SocketRevalidateOrderEvent = {
  orderId: string;
  order?: OrderEntity;
};

export type SocketNewOrderEvent = {
  orderId: string;
};

export interface SocketEvent {
  type: `${SocketEventType}`;
}
