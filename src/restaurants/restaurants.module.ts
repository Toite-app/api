import { Module } from "@nestjs/common";
import { DrizzleModule } from "@postgress-db/drizzle.module";
import { RestaurantWorkshiftPaymentCategoriesController } from "src/restaurants/workshift-payment-categories/restaurant-workshift-payment-categories.controller";
import { RestaurantWorkshiftPaymentCategoriesService } from "src/restaurants/workshift-payment-categories/restaurant-workshift-payment-categories.service";
import { TimezonesModule } from "src/timezones/timezones.module";

import { RestaurantsController } from "./@/controllers/restaurants.controller";
import { RestaurantsService } from "./@/services/restaurants.service";
import { RestaurantDishModifiersController } from "./dish-modifiers/restaurant-dish-modifiers.controller";
import { RestaurantDishModifiersService } from "./dish-modifiers/restaurant-dish-modifiers.service";
import { RestaurantHoursController } from "./hours/restaurant-hours.controller";
import { RestaurantHoursService } from "./hours/restaurant-hours.service";
import { RestaurantWorkshopsController } from "./workshops/restaurant-workshops.controller";
import { RestaurantWorkshopsService } from "./workshops/restaurant-workshops.service";

@Module({
  imports: [DrizzleModule, TimezonesModule],
  providers: [
    RestaurantsService,
    RestaurantHoursService,
    RestaurantWorkshopsService,
    RestaurantDishModifiersService,
    RestaurantWorkshiftPaymentCategoriesService,
  ],
  controllers: [
    RestaurantsController,
    RestaurantHoursController,
    RestaurantWorkshopsController,
    RestaurantDishModifiersController,
    RestaurantWorkshiftPaymentCategoriesController,
  ],
  exports: [
    RestaurantsService,
    RestaurantHoursService,
    RestaurantWorkshopsService,
  ],
})
export class RestaurantsModule {}
