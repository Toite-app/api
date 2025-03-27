import { IWorker, IWorkersToRestaurants } from "@postgress-db/schema/workers";

export enum GatewayIncomingMessage {
  SUBSCRIPTION = "subscription",
}

export enum ClientSubscriptionType {
  NEW_ORDERS = "NEW_ORDERS",
  NEW_ORDERS_AT_KITCHEN = "NEW_ORDERS_AT_KITCHEN",
  ORDERS_UPDATE = "ORDERS_UPDATE",
}

export type GatewayClientSubscription =
  | {
      id: string;
      clientId: string;
      type: ClientSubscriptionType.NEW_ORDERS;
    }
  | {
      id: string;
      clientId: string;
      type: ClientSubscriptionType.NEW_ORDERS_AT_KITCHEN;
    }
  | {
      id: string;
      clientId: string;
      type: ClientSubscriptionType.ORDERS_UPDATE;
      data: {
        orderIds: string[];
      };
    };

export enum IncomingSubscriptionAction {
  SUBSCRIBE = "subscribe",
  UNSUBSCRIBE = "unsubscribe",
}

export type IncomingSubscription = {
  action: `${IncomingSubscriptionAction}`;
} & (
  | {
      id: string;
      type: ClientSubscriptionType.NEW_ORDERS;
    }
  | {
      id: string;
      type: ClientSubscriptionType.NEW_ORDERS_AT_KITCHEN;
    }
  | {
      id: string;
      type: ClientSubscriptionType.ORDERS_UPDATE;
      data: {
        orderIds: string[];
      };
    }
);

export interface GatewayClient {
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
  SUBSCRIPTION_UPDATE = "subscription:update",
}

export type SocketOrderUpdateEvent = {
  id: string;
  type: "ORDER";
  orderId: string;
};

export interface SocketEvent {
  type: `${SocketEventType}`;
  data: SocketOrderUpdateEvent;
}
