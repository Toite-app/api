import { Module } from "@nestjs/common";
import { DrizzleModule } from "@postgress-db/drizzle.module";
import { DishMenusController } from "src/dish-menus/dish-menus.controller";

@Module({
  imports: [DrizzleModule],
  controllers: [DishMenusController],
  providers: [],
  exports: [],
})
export class DishMenusModule {}
