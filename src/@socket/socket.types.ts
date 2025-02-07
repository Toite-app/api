import { ISession } from "@postgress-db/schema/sessions";
import { IWorker } from "@postgress-db/schema/workers";
import { Socket } from "socket.io";

type userId = string;
type clientId = string;

export type ConnectedClient = {
  clientId: clientId;
  socket: Socket;
  session: Pick<ISession, "id" | "previousId" | "isActive">;
  worker: Pick<IWorker, "id" | "role" | "isBlocked" | "restaurantId">;
};

export type ConnectedClients = Record<
  userId,
  Record<clientId, ConnectedClient>
>;

export type RedisConnectedClient = Omit<ConnectedClient, "socket"> & {
  gatewayId: string;
};

export type RedisConnectedClients = Record<
  userId,
  Record<clientId, RedisConnectedClient>
>;
