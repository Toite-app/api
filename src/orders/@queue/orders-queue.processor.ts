import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Logger } from "@nestjs/common";
import { Schema } from "@postgress-db/drizzle.module";
import { restaurants } from "@postgress-db/schema/restaurants";
import { workersToRestaurants } from "@postgress-db/schema/workers";
import { Job } from "bullmq";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { OrdersRepository } from "src/orders/@/repositories/orders.repository";
import { OrderQueueJobName, ORDERS_QUEUE } from "src/orders/@queue";
import {
  OrderCrudUpdateJobDto,
  OrderDishCrudUpdateJobDto,
} from "src/orders/@queue/dto/crud-update.job";
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
    // const order = await this.ordersRepository.findById(data.orderId);

    // notify users
    await this.ordersSocketNotifier.handle(data.orderId);
  }

  private async newOrder(data: NewOrderJobDto) {
    const order = await this.pg.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, data.orderId),
      columns: {
        restaurantId: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const relatedOrderWorkers = await this.pg.query.workers.findMany({
      where: (workers, { eq, or, and, inArray, notInArray, exists }) =>
        and(
          eq(workers.isBlocked, false),
          or(
            // System and chief admins can receive notification
            // TODO: DISPATCHER HERE IS TEMPORARY
            inArray(workers.role, [
              "SYSTEM_ADMIN",
              "CHIEF_ADMIN",
              "DISPATCHER",
            ]),
            // Owners that assigned to the restaurant
            and(
              eq(workers.role, "OWNER"),
              exists(
                this.pg
                  .select({
                    id: restaurants.id,
                  })
                  .from(restaurants)
                  .where(eq(restaurants.id, String(order.restaurantId))),
              ),
            ),
            // Workers that assigned to the restaurant
            and(
              notInArray(workers.role, [
                "SYSTEM_ADMIN",
                "CHIEF_ADMIN",
                "OWNER",
                "DISPATCHER",
              ]),
              exists(
                this.pg
                  .select({ id: workersToRestaurants.restaurantId })
                  .from(workersToRestaurants)
                  .where(
                    eq(
                      workersToRestaurants.restaurantId,
                      String(order.restaurantId),
                    ),
                  ),
              ),
            ),
          ),
        ),
      columns: {
        id: true,
      },
    });

    const workerIds = relatedOrderWorkers.map((worker) => worker.id);

    await this.ordersSocketNotifier.notifyAboutNewOrder(
      workerIds,
      data.orderId,
    );
  }

  private async newOrderAtKitchen(data: NewOrderAtKitchenJobDto) {}
}
