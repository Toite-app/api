export interface GatewayClient {
  clientId: string;
  gatewayId: string;
  workerId: string;
}

export type GatewayClients = GatewayClient[];
