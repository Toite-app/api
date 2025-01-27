import { Module } from "@nestjs/common";
import { DrizzleModule } from "@postgress-db/drizzle.module";
import { GuestsModule } from "src/guests/guests.module";
import { OrdersController } from "src/orders/@/orders.controller";
import { OrderDishesService } from "src/orders/@/services/order-dishes.service";
import { OrdersService } from "src/orders/@/services/orders.service";
import { DispatcherOrdersController } from "src/orders/dispatcher/dispatcher-orders.controller";
import { DispatcherOrdersService } from "src/orders/dispatcher/dispatcher-orders.service";

@Module({
  imports: [DrizzleModule, GuestsModule],
  providers: [OrdersService, DispatcherOrdersService, OrderDishesService],
  controllers: [OrdersController, DispatcherOrdersController],
  exports: [OrdersService, OrderDishesService],
})
export class OrdersModule {}
