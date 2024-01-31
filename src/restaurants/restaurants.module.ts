import { Module } from "@nestjs/common";
import { DrizzleModule } from "@postgress-db/drizzle.module";
import { RestaurantsService } from "./services/restaurants.service";
import { RestaurantsController } from "./controllers/restaurants.controller";
import { RestaurantHoursController } from "./controllers/restaurant-hours.controller";
import { RestaurantHoursService } from "./services/restaurant-hours.service";

@Module({
  imports: [DrizzleModule],
  providers: [RestaurantsService, RestaurantHoursService],
  controllers: [RestaurantsController, RestaurantHoursController],
  exports: [RestaurantsService, RestaurantHoursService],
})
export class RestaurantsModule {}
