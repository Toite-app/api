import { Module } from "@nestjs/common";
import { DrizzleModule } from "@postgress-db/drizzle.module";

import { DishesController } from "./@/dishes.controller";
import { DishesService } from "./@/dishes.service";

@Module({
  imports: [DrizzleModule],
  controllers: [DishesController],
  providers: [DishesService],
  exports: [DishesService],
})
export class DishesModule {}
