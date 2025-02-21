import { Request } from "@core/interfaces/request";
import { SetMetadata } from "@nestjs/common";
import { IRoleEnum } from "@postgress-db/schema/workers";

export interface RestaurantGuardOptions {
  restaurantId: (req: Request) => string;
  allow: `${
    | IRoleEnum.KITCHENER
    | IRoleEnum.CASHIER
    | IRoleEnum.WAITER
    | IRoleEnum.ADMIN
    | IRoleEnum.OWNER}`[];
}

export const RESTAURANT_GUARD_KEY = "restaurantGuard";

export const RestaurantGuard = (options: RestaurantGuardOptions) =>
  SetMetadata(RESTAURANT_GUARD_KEY, options);
