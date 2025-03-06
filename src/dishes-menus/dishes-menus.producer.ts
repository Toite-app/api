import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { JobsOptions, Queue } from "bullmq";
import { DISHES_MENUS_QUEUE, DishesMenusQueueJobName } from "src/dishes-menus";

@Injectable()
export class DishesMenusProducer {
  private readonly logger = new Logger(DishesMenusProducer.name);

  constructor(
    @InjectQueue(DISHES_MENUS_QUEUE)
    private readonly queue: Queue,
  ) {}

  private async addJob(
    name: DishesMenusQueueJobName,
    data: any,
    opts?: JobsOptions,
  ) {
    try {
      return await this.queue.add(name, data, opts);
    } catch (error) {
      this.logger.error(`Failed to add ${name} job to queue:`, error);
      throw error;
    }
  }

  public async createOwnersDefaultMenu() {
    try {
      await this.addJob(
        DishesMenusQueueJobName.CREATE_OWNERS_DEFAULT_MENUS,
        {},
      );
    } catch (error) {
      this.logger.error(error);
    }
  }
}
