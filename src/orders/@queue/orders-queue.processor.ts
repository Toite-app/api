import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Logger } from "@nestjs/common";
import { Schema } from "@postgress-db/drizzle.module";
import { Job } from "bullmq";
import { plainToClass } from "class-transformer";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { SnapshotsProducer } from "src/@base/snapshots/snapshots.producer";
import { PG_CONNECTION } from "src/constants";
import { OrderDishSnapshotEntity } from "src/orders/@/entities/order-dish-snapshot.entity";
import { OrderSnapshotEntity } from "src/orders/@/entities/order-snapshot.entity";
import { OrderQueueJobName, ORDERS_QUEUE } from "src/orders/@queue";
import {
  OrderCrudUpdateJobDto,
  OrderDishCrudUpdateJobDto,
} from "src/orders/@queue/dto/crud-update.job";
import { RecalculatePricesJobDto } from "src/orders/@queue/dto/recalculate-prices-job.dto";
import { OrdersSocketNotifier } from "src/orders/@queue/services/orders-socket-notifier.service";

@Processor(ORDERS_QUEUE, {})
export class OrdersQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(OrdersQueueProcessor.name);

  constructor(
    @Inject(PG_CONNECTION)
    private readonly pg: NodePgDatabase<Schema>,
    private readonly ordersSocketNotifier: OrdersSocketNotifier,
    private readonly snapshotsProducer: SnapshotsProducer,
  ) {
    super();
  }

  /**
   * Just a bullmq processor
   */
  async process(job: Job) {
    const { name, data } = job;

    try {
      switch (name) {
        // Recalculate prices of the order
        case OrderQueueJobName.RECALCULATE_PRICES: {
          await this.recalculatePrices(data as RecalculatePricesJobDto);
          break;
        }

        case OrderQueueJobName.CRUD_UPDATE: {
          await this.crudUpdate(data as OrderCrudUpdateJobDto);
          break;
        }

        case OrderQueueJobName.DISH_CRUD_UPDATE: {
          await this.dishCrudUpdate(data as OrderDishCrudUpdateJobDto);
          break;
        }

        default: {
          throw new Error(`Unknown job name`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to process ${name} job`, error);

      throw error;
    }
  }

  /**
   * Recalculates the prices of the order
   * @param data
   */
  private async recalculatePrices(data: RecalculatePricesJobDto) {
    const { orderId } = data;
    orderId;
  }

  private async crudUpdate(data: OrderCrudUpdateJobDto) {
    // make snapshot
    await this.snapshotsProducer.create({
      model: "ORDERS",
      action: data.action,
      data: plainToClass(OrderSnapshotEntity, data.order, {
        excludeExtraneousValues: true,
      }),
      documentId: data.orderId,
      workerId: data.calledByWorkerId,
    });

    // notify users
    await this.ordersSocketNotifier.handle(data.order);
  }

  private async dishCrudUpdate(data: OrderDishCrudUpdateJobDto) {
    // notify users
    await this.ordersSocketNotifier.handleById(data.orderDish.orderId);
  }
}
