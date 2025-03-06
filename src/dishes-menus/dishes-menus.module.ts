import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { DrizzleModule } from "@postgress-db/drizzle.module";
import { RedlockModule } from "src/@base/redlock/redlock.module";
import { DISHES_MENUS_QUEUE } from "src/dishes-menus";
import { DishesMenusController } from "src/dishes-menus/dishes-menus.controller";
import { DishesMenusProcessor } from "src/dishes-menus/dishes-menus.processor";
import { DishesMenusProducer } from "src/dishes-menus/dishes-menus.producer";
import { DishesMenusService } from "src/dishes-menus/dishes-menus.service";

@Module({
  imports: [
    DrizzleModule,
    RedlockModule,
    BullModule.registerQueue({
      name: DISHES_MENUS_QUEUE,
    }),
  ],
  controllers: [DishesMenusController],
  providers: [DishesMenusService, DishesMenusProducer, DishesMenusProcessor],
  exports: [DishesMenusService],
})
export class DishesMenusModule {}
