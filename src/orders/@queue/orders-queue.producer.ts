import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { JobsOptions, Queue } from "bullmq";
import { OrderQueueJobName, ORDERS_QUEUE } from "src/orders/@queue";
import {
  OrderCrudUpdateJobDto,
  OrderDishCrudUpdateJobDto,
} from "src/orders/@queue/dto/crud-update.job";

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
   * When order dish is: created, updated, removed
   */
  public async dishCrudUpdate(payload: OrderDishCrudUpdateJobDto) {
    return this.addJob(OrderQueueJobName.DISH_CRUD_UPDATE, payload);
  }
}
