import { ForbiddenException } from "@core/errors/exceptions/forbidden.exception";
import { Request } from "@core/interfaces/request";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RESTAURANT_GUARD_KEY } from "src/restaurants/@/decorators/restaurant-guard.decorator";

@Injectable()
export class RestaurantGuard implements CanActivate {
  private readonly logger = new Logger(RestaurantGuard.name);

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as Request;

    const options = this.reflector.get(
      RESTAURANT_GUARD_KEY,
      context.getHandler(),
    );

    if (!options) return true;

    const restaurantId = options.restaurantId(request);
    const { worker } = request;
    const { allow } = options;

    if (!restaurantId) {
      this.logger.error("Restaurant ID is not defined");
      throw new ForbiddenException();
    }

    // We need to have worker in request
    if (!worker) {
      throw new ForbiddenException();
    }

    // System and chief admin can do anything
    if (worker.role === "SYSTEM_ADMIN" || worker.role === "CHIEF_ADMIN") {
      return true;
    }

    // Owner can access their own restaurant
    if (
      allow.includes("OWNER") &&
      worker.role === "OWNER" &&
      worker.ownedRestaurants.some((r) => r.id === restaurantId)
    ) {
      return true;
    }

    // Handle rest of roles that can access their restaurant
    if (
      allow.includes(worker.role) &&
      worker.workersToRestaurants.some((r) => r.restaurantId === restaurantId)
    ) {
      return true;
    }

    throw new ForbiddenException();
  }
}
