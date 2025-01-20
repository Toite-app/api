import { Module } from "@nestjs/common";
import { DrizzleModule } from "@postgress-db/drizzle.module";
import { GuestsModule } from "src/guests/guests.module";
import { OrdersController } from "src/orders/@/orders.controller";
import { OrdersService } from "src/orders/@/orders.service";

@Module({
  imports: [DrizzleModule, GuestsModule],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
