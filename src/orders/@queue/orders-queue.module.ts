import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { DrizzleModule } from "@postgress-db/drizzle.module";
import { SnapshotsModule } from "src/@base/snapshots/snapshots.module";
import { SocketModule } from "src/@socket/socket.module";
import { ORDERS_QUEUE } from "src/orders/@queue";
import { OrdersQueueProcessor } from "src/orders/@queue/orders-queue.processor";
import { OrdersQueueProducer } from "src/orders/@queue/orders-queue.producer";
import { OrdersSocketNotifier } from "src/orders/@queue/services/orders-socket-notifier.service";

@Module({
  imports: [
    SocketModule,
    DrizzleModule,
    SnapshotsModule,
    BullModule.registerQueue({
      name: ORDERS_QUEUE,
    }),
  ],
  providers: [OrdersQueueProcessor, OrdersQueueProducer, OrdersSocketNotifier],
  exports: [OrdersQueueProducer],
})
export class OrdersQueueModule {}
