import { PickType } from "@nestjs/swagger";
import { RestaurantDto } from "./restaurant.dto";

export class CreateRestaurantDto extends PickType(RestaurantDto, [
  "name",
  "legalEntity",
  "address",
  "latitude",
  "longitude",
  "isEnabled",
]) {}
