import { IWorker } from "@postgress-db/schema/workers";

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
