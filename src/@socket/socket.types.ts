import { IWorker } from "@postgress-db/schema/workers";
import { OrderEntity } from "src/orders/@/entities/order.entity";

export enum GatewayIncomingMessage {
  SUBSCRIPTION = "subscription",
}

export enum ClientSubscriptionType {
  ORDER = "ORDER",
  MULTIPLE_ORDERS = "MULTIPLE_ORDERS",
  ORDER_DISHES = "ORDER_DISHES",
  MULTIPLE_ORDER_DISHES = "MULTIPLE_ORDER_DISHES",
}

export interface ClientOrderSubscription {
  orderId: string;
}

export interface ClientMultipleOrdersSubscription {
  orderIds: string[];
}

export interface ClientOrderDishesSubscription {
  orderId: string;
}

export interface ClientMultipleOrderDishesSubscription {
  orderIds: string[];
}

export type GatewayClientSubscription =
  | {
      id: string;
      clientId: string;
      type: ClientSubscriptionType.ORDER;
      data: ClientOrderSubscription;
    }
  | {
      id: string;
      clientId: string;
      type: ClientSubscriptionType.MULTIPLE_ORDERS;
      data: ClientMultipleOrdersSubscription;
    }
  | {
      id: string;
      clientId: string;
      type: ClientSubscriptionType.ORDER_DISHES;
      data: ClientOrderDishesSubscription;
    }
  | {
      id: string;
      clientId: string;
      type: ClientSubscriptionType.MULTIPLE_ORDER_DISHES;
      data: ClientMultipleOrderDishesSubscription;
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
      type: ClientSubscriptionType.ORDER;
      data: ClientOrderSubscription;
    }
  | {
      id: string;
      type: ClientSubscriptionType.MULTIPLE_ORDERS;
      data: ClientMultipleOrdersSubscription;
    }
  | {
      id: string;
      type: ClientSubscriptionType.ORDER_DISHES;
      data: ClientOrderDishesSubscription;
    }
  | {
      id: string;
      type: ClientSubscriptionType.MULTIPLE_ORDER_DISHES;
      data: ClientMultipleOrderDishesSubscription;
    }
);

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

export enum SocketEventType {
  SUBSCRIPTION_UPDATE = "subscription:update",
}

export type SocketOrderUpdateEvent = {
  id: string;
  type: "ORDER";
  order: OrderEntity;
};

export interface SocketEvent {
  type: `${SocketEventType}`;
  data: SocketOrderUpdateEvent;
}
