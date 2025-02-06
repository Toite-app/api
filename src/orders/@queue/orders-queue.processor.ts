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

    const orderDishes = await this.pg.query.orderDishes.findMany({
      where: (orderDishes, { eq, and, gt }) =>
        and(
          eq(orderDishes.orderId, orderId),
          eq(orderDishes.isRemoved, false),
          gt(orderDishes.quantity, 0),
        ),
      columns: {
        price: true,
        quantity: true,
        finalPrice: true,
        surchargeAmount: true,
        discountAmount: true,
      },
    });

    if (!orderDishes.length) {
      this.logger.warn(`No dishes found for order ${orderId}`);
      return;
    }

    const prices = orderDishes.reduce(
      (acc, dish) => {
        acc.subtotal += Number(dish.price) * Number(dish.quantity);
        acc.surchargeAmount +=
          Number(dish.surchargeAmount) * Number(dish.quantity);
        acc.discountAmount +=
          Number(dish.discountAmount) * Number(dish.quantity);
        acc.total += Number(dish.finalPrice) * Number(dish.quantity);
        return acc;
      },
      { subtotal: 0, surchargeAmount: 0, discountAmount: 0, total: 0 },
    );

    await this.pg
      .update(orders)
      .set({
        subtotal: prices.subtotal.toString(),
        surchargeAmount: prices.surchargeAmount.toString(),
        discountAmount: prices.discountAmount.toString(),
        total: prices.total.toString(),
      })
      .where(eq(orders.id, orderId));
  }
}
