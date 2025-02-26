import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { NotFoundException } from "@core/errors/exceptions/not-found.exception";
import { RequestWorker } from "@core/interfaces/request";
import { Inject, Injectable } from "@nestjs/common";
import { Schema } from "@postgress-db/drizzle.module";
import { orderDishes } from "@postgress-db/schema/order-dishes";
import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { OrdersQueueProducer } from "src/orders/@queue/orders-queue.producer";

@Injectable()
export class KitchenerOrderActionsService {
  constructor(
    @Inject(PG_CONNECTION)
    private readonly pg: NodePgDatabase<Schema>,
    private readonly ordersProducer: OrdersQueueProducer,
  ) {}

  public async markDishAsReady(
    orderDishId: string,
    opts?: { worker?: RequestWorker },
  ) {
    const orderDish = await this.pg.query.orderDishes.findFirst({
      where: (orderDishes, { eq }) => eq(orderDishes.id, orderDishId),
    });

    if (!orderDish) {
      throw new NotFoundException("errors.order-dishes.order-dish-not-found");
    }

    if (orderDish.status !== "cooking") {
      throw new BadRequestException(
        "errors.order-dishes.cant-force-not-cooking-dish",
      );
    }

    const updatedOrderDish = await this.pg.transaction(async (tx) => {
      const [updatedOrderDish] = await tx
        .update(orderDishes)
        .set({
          status: "ready",
          readyAt: new Date(),
        })
        .where(eq(orderDishes.id, orderDishId))
        .returning();

      return updatedOrderDish;
    });

    await this.ordersProducer.dishCrudUpdate({
      action: "UPDATE",
      orderDishId: orderDish.id,
      orderDish: updatedOrderDish,
      calledByWorkerId: opts?.worker?.id,
    });

    return updatedOrderDish;
  }
}
