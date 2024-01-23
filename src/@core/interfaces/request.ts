import { ISession, IWorker } from "@postgress-db/schema";
import { Request as Req } from "express";

export interface Request extends Req {
  worker?: Omit<IWorker, "passwordHash"> & { passwordHash: undefined };
  session?: ISession;
}
