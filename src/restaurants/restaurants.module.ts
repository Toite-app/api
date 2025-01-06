import { Module } from "@nestjs/common";
import { DrizzleModule } from "@postgress-db/drizzle.module";

import { RestaurantHoursController } from "./hours/restaurant-hours.controller";
import { RestaurantsController } from "./@/controllers/restaurants.controller";
import { RestaurantHoursService } from "./hours/restaurant-hours.service";
import { RestaurantsService } from "./@/services/restaurants.service";

@Module({
  imports: [DrizzleModule],
  providers: [RestaurantsService, RestaurantHoursService],
  controllers: [RestaurantsController, RestaurantHoursController],
  exports: [RestaurantsService, RestaurantHoursService],
})
export class RestaurantsModule {}
