import { IRestaurant } from "@postgress-db/schema/restaurants";
import { ISession } from "@postgress-db/schema/sessions";
import { IWorker, IWorkersToRestaurants } from "@postgress-db/schema/workers";
import { FastifyRequest } from "fastify";

export type RequestWorker = Pick<
  IWorker,
  | "id"
  | "name"
  | "login"
  | "role"
  | "isBlocked"
  | "hiredAt"
  | "firedAt"
  | "onlineAt"
  | "createdAt"
  | "updatedAt"
> & {
  workersToRestaurants: Pick<IWorkersToRestaurants, "restaurantId">[];
  ownedRestaurants: Pick<IRestaurant, "id">[];
};

export type RequestSession = Pick<
  ISession,
  "id" | "previousId" | "workerId" | "isActive" | "refreshedAt"
> & {
  worker: RequestWorker | null;
};

export interface Request extends FastifyRequest {
  requestId?: string;
  timestamp?: number;
  worker?: RequestWorker | null;
  session?: RequestSession | null;
  user?: {
    id: string;
    [key: string]: any;
  };
}
