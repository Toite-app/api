import { IWorker, IWorkersToRestaurants } from "@postgress-db/schema/workers";

export enum AUTH_STRATEGY {
  accessToken = "access token",
  refreshToken = "refresh token",
}

export enum AUTH_COOKIES {
  token = "toite-auth-token",
}

export type SessionTokenPayload = {
  sessionId: string;
  workerId: string;
  worker: Pick<IWorker, "name" | "login" | "role" | "isBlocked"> & {
    workersToRestaurants: Pick<IWorkersToRestaurants, "restaurantId">[];
  };
  httpAgent: string;
  ip: string;
  version: number;
};
