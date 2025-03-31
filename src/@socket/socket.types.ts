import { IWorker, IWorkersToRestaurants } from "@postgress-db/schema/workers";

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
  /** For /orders/:orderId page */
  REVALIDATE_ORDER_PAGE = "R-3JK",
  /** For /orders/dispatcher */
  REVALIDATE_DISPATCHER_ORDERS_PAGE = "R-ZGI",
  /** For /orders/kitchen */
  REVALIDATE_KITCHENER_ORDERS_PAGE = "R-a2I",
}

export type SocketRevalidateOrderEvent = {
  orderId: string;
};

export type SocketNewOrderEvent = {
  orderId: string;
};

export interface SocketEvent {
  type: `${SocketEventType}`;
}
