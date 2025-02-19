import { ISession } from "@postgress-db/schema/sessions";
import { IWorker, IWorkersToRestaurants } from "@postgress-db/schema/workers";
import { Request as Req } from "express";

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
};

export type RequestSession = Pick<
  ISession,
  "id" | "previousId" | "workerId" | "isActive" | "refreshedAt"
> & {
  worker: RequestWorker | null;
};

export interface Request extends Req {
  requestId?: string;
  timestamp?: number;
  worker?: RequestWorker | null;
  session?: RequestSession | null;
  user?: {
    id: string;
    [key: string]: any;
  };
}
