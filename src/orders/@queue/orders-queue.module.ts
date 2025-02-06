import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { DrizzleModule } from "@postgress-db/drizzle.module";
import { ORDERS_QUEUE } from "src/orders/@queue";
import { OrdersQueueProcessor } from "src/orders/@queue/orders-queue.processor";
import { OrdersQueueProducer } from "src/orders/@queue/orders-queue.producer";

@Module({
  imports: [
    DrizzleModule,
    BullModule.registerQueue({
      name: ORDERS_QUEUE,
    }),
  ],
  providers: [OrdersQueueProcessor, OrdersQueueProducer],
  exports: [OrdersQueueProducer],
})
export class OrdersQueueModule {}
