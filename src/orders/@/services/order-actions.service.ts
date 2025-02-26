import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { NotFoundException } from "@core/errors/exceptions/not-found.exception";
import { RequestWorker } from "@core/interfaces/request";
import { Inject, Injectable } from "@nestjs/common";
import { Schema } from "@postgress-db/drizzle.module";
import { orderDishes } from "@postgress-db/schema/order-dishes";
import { orders } from "@postgress-db/schema/orders";
import { eq, inArray } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { OrderAvailableActionsEntity } from "src/orders/@/entities/order-available-actions.entity";
import { OrdersQueueProducer } from "src/orders/@queue/orders-queue.producer";

@Injectable()
export class OrderActionsService {
  constructor(
    @Inject(PG_CONNECTION)
    private readonly pg: NodePgDatabase<Schema>,
    private readonly ordersProducer: OrdersQueueProducer,
  ) {}

  public async getAvailableActions(
    id: string,
  ): Promise<OrderAvailableActionsEntity> {
    const result: OrderAvailableActionsEntity = {
      canPrecheck: false,
      canCalculate: false,
      canSendToKitchen: false,
    };

    result.canPrecheck = true;

    const order = await this.pg.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, id),
      columns: {
        status: true,
      },
    });

    if (!order) {
      throw new NotFoundException("errors.orders.with-this-id-doesnt-exist");
    }

    const orderDishes = await this.pg.query.orderDishes.findMany({
      where: (orderDishes, { and, eq, gt }) =>
        and(
          eq(orderDishes.orderId, id),
          eq(orderDishes.isRemoved, false),
          gt(orderDishes.quantity, 0),
        ),
      columns: {
        status: true,
      },
    });

    if (orderDishes.some((d) => d.status === "pending")) {
      result.canSendToKitchen = true;
    }

    if (
      order.status !== "pending" &&
      order.status !== "cooking" &&
      orderDishes.every((d) => d.status === "completed")
    ) {
      result.canCalculate = true;
    }

    return result;
  }

  public async sendToKitchen(
    orderId: string,
    opts?: { worker?: RequestWorker },
  ) {
    const order = await this.pg.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, orderId),
      columns: {
        cookingAt: true,
      },
    });

    const dishes = await this.pg.query.orderDishes.findMany({
      where: (orderDishes, { eq, and, gt }) =>
        and(
          eq(orderDishes.orderId, orderId),
          eq(orderDishes.isRemoved, false),
          gt(orderDishes.quantity, 0),
        ),
      columns: {
        id: true,
        status: true,
      },
    });

    // No dishes can be sent to the kitchen
    if (!dishes.some((d) => d.status === "pending")) {
      throw new BadRequestException(
        "errors.order-actions.no-dishes-is-pending",
      );
    }

    const isAdditional = dishes.some((d) => d.status === "ready");
    const pendingDishes = dishes.filter((d) => d.status === "pending");

    await this.pg.transaction(async (tx) => {
      // Set cooking status for dishes and isAdditional flag
      await tx
        .update(orderDishes)
        .set({
          status: "cooking",
          isAdditional,
          cookingAt: new Date(),
        })
        .where(
          // Change status of pending dishes to cooking
          inArray(
            orderDishes.id,
            pendingDishes.map((d) => d.id),
          ),
        );

      // Set cooking status for order
      await tx
        .update(orders)
        .set({
          status: "cooking",
          cookingAt:
            order && order.cookingAt ? new Date(order.cookingAt) : new Date(),
        })
        .where(eq(orders.id, orderId));
    });
  }
}
