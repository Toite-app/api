import { IWorker } from "@postgress-db/schema/workers";

export enum GatewayIncomingMessage {
  SUBSCRIPTION = "subscription",
}

export enum ClientSubscriptionType {
  ORDER = "ORDER",
}

export interface ClientOrderSubscription {
  orderId: string;
}

export type GatewayClientSubscription = {
  id: string;
  clientId: string;
  type: `${ClientSubscriptionType.ORDER}`;
  data: ClientOrderSubscription;
};

export enum IncomingSubscriptionAction {
  SUBSCRIBE = "subscribe",
  UNSUBSCRIBE = "unsubscribe",
}

export type IncomingSubscription = GatewayClientSubscription & {
  action: `${IncomingSubscriptionAction}`;
};

export interface GatewayClient {
  clientId: string;
  gatewayId: string;
  workerId: string;
  connectedAt: Date;
}

export type GatewayClients = GatewayClient[];

export type GatewayWorker = Pick<IWorker, "role" | "id" | "restaurantId"> & {
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
