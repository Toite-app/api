import { PickType } from "@nestjs/swagger";

import { RestaurantEntity } from "../entities/restaurant.entity";

export class CreateRestaurantDto extends PickType(RestaurantEntity, [
  "name",
  "legalEntity",
  "address",
  "latitude",
  "longitude",
  "timezone",
  "isEnabled",
  "isClosedForever",
]) {}
