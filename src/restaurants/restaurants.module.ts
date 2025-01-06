import { Module } from "@nestjs/common";
import { DrizzleModule } from "@postgress-db/drizzle.module";

import { RestaurantsController } from "./@/controllers/restaurants.controller";
import { RestaurantsService } from "./@/services/restaurants.service";
import { RestaurantHoursController } from "./hours/restaurant-hours.controller";
import { RestaurantHoursService } from "./hours/restaurant-hours.service";
import { RestaurantWorkshopsController } from "./workshops/restaurant-workshops.controller";
import { RestaurantWorkshopsService } from "./workshops/restaurant-workshops.service";

@Module({
  imports: [DrizzleModule],
  providers: [
    RestaurantsService,
    RestaurantHoursService,
    RestaurantWorkshopsService,
  ],
  controllers: [
    RestaurantsController,
    RestaurantHoursController,
    RestaurantWorkshopsController,
  ],
  exports: [
    RestaurantsService,
    RestaurantHoursService,
    RestaurantWorkshopsService,
  ],
})
export class RestaurantsModule {}
