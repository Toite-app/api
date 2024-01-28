import { SetMetadata } from "@nestjs/common";
import { WorkerRole } from "@postgress-db/schema";

export const ROLES_KEY = "roles";
export const Roles = (...roles: WorkerRole[]) => SetMetadata(ROLES_KEY, roles);
