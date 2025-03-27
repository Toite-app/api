import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Logger } from "@nestjs/common";
import { Schema } from "@postgress-db/drizzle.module";
import { Job } from "bullmq";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { OrderQueueJobName, ORDERS_QUEUE } from "src/orders/@queue";
import {
  OrderCrudUpdateJobDto,
  OrderDishCrudUpdateJobDto,
} from "src/orders/@queue/dto/crud-update.job";
import { OrdersSocketNotifier } from "src/orders/@queue/services/orders-socket-notifier.service";

@Processor(ORDERS_QUEUE, {})
export class OrdersQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(OrdersQueueProcessor.name);

  constructor(
    @Inject(PG_CONNECTION)
    private readonly pg: NodePgDatabase<Schema>,
    private readonly ordersSocketNotifier: OrdersSocketNotifier,
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
        case OrderQueueJobName.UPDATE: {
          await this.update(data as OrderCrudUpdateJobDto);
          break;
        }

        case OrderQueueJobName.DISH_UPDATE: {
          await this.update({
            orderId: (data as OrderDishCrudUpdateJobDto).orderDish.orderId,
          });
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

  private async update(data: OrderCrudUpdateJobDto) {
    // notify users
    await this.ordersSocketNotifier.handle(data.orderId);
  }
}
