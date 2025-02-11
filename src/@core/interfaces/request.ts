import { ISession } from "@postgress-db/schema/sessions";
import { IWorker } from "@postgress-db/schema/workers";
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
  | "restaurantId"
>;

export type RequestSession = Pick<
  ISession,
  "id" | "previousId" | "workerId" | "isActive" | "refreshedAt"
> & {
  worker: RequestWorker | null;
};

export interface Request extends Req {
  requestId?: string;
  worker?: RequestWorker | null;
  session?: RequestSession | null;
  user?: {
    id: string;
    [key: string]: any;
  };
}
