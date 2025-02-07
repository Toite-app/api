import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Logger } from "@nestjs/common";
import { Schema } from "@postgress-db/drizzle.module";
import { orders } from "@postgress-db/schema/orders";
import { Job } from "bullmq";
import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { OrderQueueJobName, ORDERS_QUEUE } from "src/orders/@queue";
import { RecalculatePricesJobDto } from "src/orders/@queue/dto/recalculate-prices-job.dto";

@Processor(ORDERS_QUEUE, {})
export class OrdersQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(OrdersQueueProcessor.name);

  constructor(
    @Inject(PG_CONNECTION)
    private readonly pg: NodePgDatabase<Schema>,
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
  }
}
