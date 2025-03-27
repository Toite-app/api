import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { ForbiddenException } from "@core/errors/exceptions/forbidden.exception";
import { NotFoundException } from "@core/errors/exceptions/not-found.exception";
import { RequestWorker } from "@core/interfaces/request";
import { Inject, Injectable } from "@nestjs/common";
import { Schema } from "@postgress-db/drizzle.module";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { OrderDishesRepository } from "src/orders/@/repositories/order-dishes.repository";
import { OrdersQueueProducer } from "src/orders/@queue/orders-queue.producer";

@Injectable()
export class KitchenerOrderActionsService {
  constructor(
    @Inject(PG_CONNECTION)
    private readonly pg: NodePgDatabase<Schema>,
    private readonly ordersProducer: OrdersQueueProducer,
    private readonly repository: OrderDishesRepository,
  ) {}

  public async markDishAsReady(
    orderDishId: string,
    opts?: { worker?: RequestWorker },
  ) {
    const orderDish = await this.pg.query.orderDishes.findFirst({
      where: (orderDishes, { eq }) => eq(orderDishes.id, orderDishId),
      with: {
        order: {
          columns: {
            restaurantId: true,
          },
        },
      },
    });

    if (opts?.worker && orderDish?.order.restaurantId) {
      const { worker } = opts;

      if (worker.role === "SYSTEM_ADMIN" || worker.role === "CHIEF_ADMIN") {
      }
      // Check if owner has access to restaurant
      else if (
        worker.role === "OWNER" &&
        !worker.ownedRestaurants.some(
          (r) => r.id === orderDish.order.restaurantId,
        )
      ) {
        throw new ForbiddenException(
          "errors.order-dishes.cant-force-ready-dish",
        );
      }
      // Restrict to restaurant scope admins
      else if (
        worker.role === "ADMIN" &&
        !worker.workersToRestaurants.some(
          (r) => r.restaurantId === orderDish.order.restaurantId,
        )
      ) {
        throw new ForbiddenException(
          "errors.order-dishes.cant-force-ready-dish",
        );
      }
    }

    if (!orderDish) {
      throw new NotFoundException("errors.order-dishes.order-dish-not-found");
    }

    if (orderDish.status !== "cooking") {
      throw new BadRequestException(
        "errors.order-dishes.cant-force-not-cooking-dish",
      );
    }

    const updatedOrderDish = await this.repository.update(
      orderDishId,
      {
        status: "ready",
        readyAt: new Date(),
      },
      {
        workerId: opts?.worker?.id,
      },
    );

    await this.ordersProducer.dishUpdate({
      orderDish: updatedOrderDish,
    });

    return updatedOrderDish;
  }
}
