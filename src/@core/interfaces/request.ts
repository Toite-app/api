import { ISession } from "@postgress-db/schema/sessions";
import { IWorker } from "@postgress-db/schema/workers";
import { Request as Req } from "express";

export interface Request extends Req {
  worker?: Omit<IWorker, "passwordHash"> & { passwordHash: undefined };
  session?: ISession;
}
