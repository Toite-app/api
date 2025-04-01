import { Module } from "@nestjs/common";
import { DrizzleModule } from "@postgress-db/drizzle.module";
import { SnapshotsModule } from "src/@base/snapshots/snapshots.module";
import { GuestsModule } from "src/guests/guests.module";
import { OrderActionsController } from "src/orders/@/order-actions.controller";
import { OrderDishesController } from "src/orders/@/order-dishes.controller";
import { OrderHistoryController } from "src/orders/@/order-history.controller";
import { OrderMenuController } from "src/orders/@/order-menu.controller";
import { OrdersController } from "src/orders/@/orders.controller";
import { OrderDishesRepository } from "src/orders/@/repositories/order-dishes.repository";
import { OrdersRepository } from "src/orders/@/repositories/orders.repository";
import { OrderActionsService } from "src/orders/@/services/order-actions.service";
import { OrderDiscountsService } from "src/orders/@/services/order-discounts.service";
import { OrderDishesService } from "src/orders/@/services/order-dishes.service";
import { OrderHistoryService } from "src/orders/@/services/order-history.service";
import { OrderMenuService } from "src/orders/@/services/order-menu.service";
import { OrderUpdatersService } from "src/orders/@/services/order-updaters.service";
import { OrdersService } from "src/orders/@/services/orders.service";
import { OrdersQueueModule } from "src/orders/@queue/orders-queue.module";
import { DispatcherOrdersController } from "src/orders/dispatcher/dispatcher-orders.controller";
import { DispatcherOrdersService } from "src/orders/dispatcher/dispatcher-orders.service";
import { KitchenerOrderActionsService } from "src/orders/kitchener/kitchener-order-actions.service";
import { KitchenerOrdersController } from "src/orders/kitchener/kitchener-orders.controller";
import { KitchenerOrdersService } from "src/orders/kitchener/kitchener-orders.service";
import { TimezonesModule } from "src/timezones/timezones.module";

@Module({
  imports: [
    DrizzleModule,
    GuestsModule,
    OrdersQueueModule,
    SnapshotsModule,
    TimezonesModule,
  ],
  providers: [
    OrdersRepository,
    OrderDishesRepository,
    OrdersService,
    DispatcherOrdersService,
    KitchenerOrdersService,
    OrderDishesService,
    OrderMenuService,
    OrderUpdatersService,
    OrderActionsService,
    KitchenerOrderActionsService,
    OrderHistoryService,
    OrderDiscountsService,
  ],
  controllers: [
    OrdersController,
    OrderMenuController,
    OrderDishesController,
    DispatcherOrdersController,
    KitchenerOrdersController,
    OrderActionsController,
    OrderHistoryController,
  ],
  exports: [
    OrdersService,
    OrderDishesService,
    OrdersRepository,
    OrderDishesRepository,
  ],
})
export class OrdersModule {}
