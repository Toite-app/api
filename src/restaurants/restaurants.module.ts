import { Module } from "@nestjs/common";
import { DrizzleModule } from "@postgress-db/drizzle.module";
import { RestaurantsService } from "./restaurants.service";
import { RestaurantsController } from "./restaurants.controller";

@Module({
  imports: [DrizzleModule],
  providers: [RestaurantsService],
  controllers: [RestaurantsController],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}
