import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { JobsOptions, Queue } from "bullmq";
import { OrderQueueJobName, ORDERS_QUEUE } from "src/orders/@queue";
import { OrderCrudUpdateJobDto } from "src/orders/@queue/dto/crud-update.job";
import { RecalculatePricesJobDto } from "src/orders/@queue/dto/recalculate-prices-job.dto";

@Injectable()
export class OrdersQueueProducer {
  private readonly logger = new Logger(OrdersQueueProducer.name);

  constructor(
    @InjectQueue(ORDERS_QUEUE)
    private readonly queue: Queue,
  ) {}

  private async addJob(name: OrderQueueJobName, data: any, opts?: JobsOptions) {
    try {
      return await this.queue.add(name, data, opts);
    } catch (error) {
      this.logger.error(`Failed to add ${name} job to queue:`, error);
      throw error;
    }
  }

  /**
   * When order is: created, updated, removed
   */
  public async crudUpdate(payload: OrderCrudUpdateJobDto) {
    return this.addJob(OrderQueueJobName.CRUD_UPDATE, payload);
  }

  /**
   * This producer creates a job that recalculates prices of the order based on the order dishes
   * @param orderId ID of the order that needs to be recalculated
   * @returns Job
   */
  public async recalculatePrices(orderId: string) {
    return this.addJob(OrderQueueJobName.RECALCULATE_PRICES, {
      orderId,
    } satisfies RecalculatePricesJobDto);
  }
}
