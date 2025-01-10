import { Module } from "@nestjs/common";
import { DrizzleModule } from "@postgress-db/drizzle.module";

import { DishCategoriesController } from "./dish-categories.controller";
import { DishCategoriesService } from "./dish-categories.service";

@Module({
  imports: [DrizzleModule],
  controllers: [DishCategoriesController],
  providers: [DishCategoriesService],
  exports: [DishCategoriesService],
})
export class DishCategoriesModule {}
