import { Module } from "@nestjs/common";
import { DrizzleModule } from "@postgress-db/drizzle.module";
import { GuestsModule } from "src/guests/guests.module";
import { OrderActionsController } from "src/orders/@/order-actions.controller";
import { OrderDishesController } from "src/orders/@/order-dishes.controller";
import { OrdersController } from "src/orders/@/orders.controller";
import { OrderActionsService } from "src/orders/@/services/order-actions.service";
import { OrderDishesService } from "src/orders/@/services/order-dishes.service";
import { OrderPricesService } from "src/orders/@/services/order-prices.service";
import { OrdersService } from "src/orders/@/services/orders.service";
import { OrdersQueueModule } from "src/orders/@queue/orders-queue.module";
import { DispatcherOrdersController } from "src/orders/dispatcher/dispatcher-orders.controller";
import { DispatcherOrdersService } from "src/orders/dispatcher/dispatcher-orders.service";
import { KitchenerOrdersController } from "src/orders/kitchener/kitchener-orders.controller";
import { KitchenerOrdersService } from "src/orders/kitchener/kitchener-orders.service";

@Module({
  imports: [DrizzleModule, GuestsModule, OrdersQueueModule],
  providers: [
    OrdersService,
    DispatcherOrdersService,
    KitchenerOrdersService,
    OrderDishesService,
    OrderPricesService,
    OrderActionsService,
  ],
  controllers: [
    OrdersController,
    OrderDishesController,
    DispatcherOrdersController,
    KitchenerOrdersController,
    OrderActionsController,
  ],
  exports: [OrdersService, OrderDishesService],
})
export class OrdersModule {}
