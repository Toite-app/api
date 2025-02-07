import { IWorker } from "@postgress-db/schema/workers";

export interface GatewayClient {
  clientId: string;
  gatewayId: string;
  workerId: string;
}

export type GatewayClients = GatewayClient[];

export type GatewayWorker = Pick<IWorker, "role" | "id">;
