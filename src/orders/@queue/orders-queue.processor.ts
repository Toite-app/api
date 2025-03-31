import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Logger } from "@nestjs/common";
import { Schema } from "@postgress-db/drizzle.module";
import { Job } from "bullmq";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { OrdersRepository } from "src/orders/@/repositories/orders.repository";
import { OrderQueueJobName, ORDERS_QUEUE } from "src/orders/@queue";
import {
  OrderCrudUpdateJobDto,
  OrderDishCrudUpdateJobDto,
} from "src/orders/@queue/dto/crud-update.job";
import { NewOrderAtKitchenJobDto } from "src/orders/@queue/dto/new-order-at-kitchen.dto";
import { NewOrderJobDto } from "src/orders/@queue/dto/new-order.job";
import { OrdersSocketNotifier } from "src/orders/@queue/services/orders-socket-notifier.service";

@Processor(ORDERS_QUEUE, {})
export class OrdersQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(OrdersQueueProcessor.name);

  constructor(
    @Inject(PG_CONNECTION)
    private readonly pg: NodePgDatabase<Schema>,
    private readonly ordersSocketNotifier: OrdersSocketNotifier,
    private readonly ordersRepository: OrdersRepository,
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

        case OrderQueueJobName.NEW_ORDER: {
          await this.newOrder(data as NewOrderJobDto);
          break;
        }

        case OrderQueueJobName.NEW_ORDER_AT_KITCHEN: {
          await this.newOrderAtKitchen(data as NewOrderAtKitchenJobDto);
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
    await this.ordersSocketNotifier.handleUpdate(data.orderId);
  }

  private async newOrder(data: NewOrderJobDto) {
    await this.ordersSocketNotifier.handleCreation(data.orderId);
  }

  private async newOrderAtKitchen(data: NewOrderAtKitchenJobDto) {
    await this.ordersSocketNotifier.handleUpdate(data.orderId);
  }
}
