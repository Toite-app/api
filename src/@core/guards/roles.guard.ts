import { ROLES_KEY } from "@core/decorators/roles.decorator";
import { ForbiddenException } from "@core/errors/exceptions/forbidden.exception";
import { Request } from "@core/interfaces/request";
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { WorkerRole } from "@postgress-db/schema/workers";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<WorkerRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const notAllowed = () => {
      throw new ForbiddenException(
        "errors.common.forbidden-access-to-resource",
      );
    };

    // If there is no roles, then allow access
    if (!roles) return true;

    const request = context.switchToHttp().getRequest() as Request;

    if (!request?.worker?.role) return notAllowed();

    const isAllowed = roles.includes(request.worker.role);

    if (isAllowed) return true;

    return notAllowed();
  }
}
