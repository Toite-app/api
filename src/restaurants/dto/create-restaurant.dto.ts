import { PickType } from "@nestjs/swagger";

import { RestaurantDto } from "../entities/restaurant.entity";

export class CreateRestaurantDto extends PickType(RestaurantDto, [
  "name",
  "legalEntity",
  "address",
  "latitude",
  "longitude",
  "isEnabled",
  "isClosedForever",
]) {}
