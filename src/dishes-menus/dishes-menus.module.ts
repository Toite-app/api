import { Module } from "@nestjs/common";
import { DrizzleModule } from "@postgress-db/drizzle.module";
import { DishesMenusController } from "src/dishes-menus/dishes-menus.controller";
import { DishesMenusService } from "src/dishes-menus/dishes-menus.service";

@Module({
  imports: [DrizzleModule],
  controllers: [DishesMenusController],
  providers: [DishesMenusService],
  exports: [DishesMenusService],
})
export class DishesMenusModule {}
