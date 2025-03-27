import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { ForbiddenException } from "@core/errors/exceptions/forbidden.exception";
import { NotFoundException } from "@core/errors/exceptions/not-found.exception";
import { ServerErrorException } from "@core/errors/exceptions/server-error.exception";
import { RequestWorker } from "@core/interfaces/request";
import { Inject, Injectable } from "@nestjs/common";
import { Schema } from "@postgress-db/drizzle.module";
import {
  orderDishes,
  orderDishesReturnments,
} from "@postgress-db/schema/order-dishes";
import { orderHistoryRecords } from "@postgress-db/schema/order-history";
import {
  orderPrecheckPositions,
  orderPrechecks,
} from "@postgress-db/schema/order-prechecks";
import { inArray } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { CreateOrderDishReturnmentDto } from "src/orders/@/dtos/create-order-dish-returnment.dto";
import { OrderAvailableActionsEntity } from "src/orders/@/entities/order-available-actions.entity";
import { OrderPrecheckEntity } from "src/orders/@/entities/order-precheck.entity";
import { OrderDishesRepository } from "src/orders/@/repositories/order-dishes.repository";
import { OrdersRepository } from "src/orders/@/repositories/orders.repository";
import { OrdersQueueProducer } from "src/orders/@queue/orders-queue.producer";

@Injectable()
export class OrderActionsService {
  constructor(
    @Inject(PG_CONNECTION)
    private readonly pg: NodePgDatabase<Schema>,
    private readonly ordersProducer: OrdersQueueProducer,
    private readonly repository: OrdersRepository,
    private readonly orderDishesRepository: OrderDishesRepository,
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
      // TODO: Implement order-dishes repository updateMany method
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
      await this.repository.update(
        orderId,
        {
          status: "cooking",
          cookingAt:
            order && order.cookingAt ? new Date(order.cookingAt) : new Date(),
        },
        {
          workerId: opts?.worker?.id,
        },
      );
    });
  }

  public async makeOrderDishReturnment(
    orderDishId: string,
    payload: CreateOrderDishReturnmentDto,
    opts: { worker: RequestWorker },
  ) {
    const orderDish = await this.pg.query.orderDishes.findFirst({
      where: (orderDishes, { eq, and }) =>
        and(eq(orderDishes.id, orderDishId), eq(orderDishes.isRemoved, false)),
      columns: {
        status: true,
        quantity: true,
        quantityReturned: true,
      },
      with: {
        order: {
          columns: {
            restaurantId: true,
          },
        },
      },
    });

    if (!orderDish || !orderDish.order) {
      throw new NotFoundException();
    }

    if (
      opts.worker.role === "SYSTEM_ADMIN" ||
      opts.worker.role === "CHIEF_ADMIN"
    ) {
    }
    // Owner role handling
    else if (opts.worker.role === "OWNER") {
      if (
        !opts.worker.ownedRestaurants.some(
          (r) => r.id === orderDish.order.restaurantId,
        )
      ) {
        throw new ForbiddenException(
          "errors.order-actions.not-enough-rights-to-make-returnment",
        );
      }
    }
    // Assigned admins or cashiers
    else if (opts.worker.role === "ADMIN" || opts.worker.role === "CASHIER") {
      if (
        !opts.worker.workersToRestaurants.some(
          (w) => w.restaurantId === orderDish.order.restaurantId,
        )
      ) {
        throw new ForbiddenException(
          "errors.order-actions.not-enough-rights-to-make-returnment",
        );
      }
    }
    // Other roles
    else {
      throw new ForbiddenException(
        "errors.order-actions.not-enough-rights-to-make-returnment",
      );
    }

    if (orderDish.status !== "completed" && orderDish.status !== "ready") {
      throw new BadRequestException(
        "errors.order-dishes.cant-make-returnment-for-not-completed-or-ready-dish",
      );
    }

    if (orderDish.quantity === 0) {
      throw new BadRequestException(
        "errors.order-dishes.cant-make-returnment-for-dish-with-zero-quantity",
      );
    }

    if (payload.quantity > orderDish.quantity) {
      throw new BadRequestException(
        "errors.order-  dishes.cant-make-returnment-for-more-than-added",
      );
    }

    const quantity = orderDish.quantity - payload.quantity;
    const quantityReturned = orderDish.quantityReturned + payload.quantity;

    await this.pg.transaction(async (tx) => {
      // Update order dish
      await this.orderDishesRepository.update(
        orderDishId,
        {
          quantity,
          quantityReturned,
        },
        {
          tx,
          workerId: opts.worker.id,
        },
      );

      // Create returnment
      await this.pg.insert(orderDishesReturnments).values({
        orderDishId,
        quantity: payload.quantity,
        reason: payload.reason,
        workerId: opts.worker.id,
        // TODO: Implement isDoneAfterPrecheck flag
        isDoneAfterPrecheck: false,
      });
    });
  }

  public async createPrecheck(
    orderId: string,
    opts: { worker: RequestWorker },
  ): Promise<OrderPrecheckEntity> {
    const availableActions = await this.getAvailableActions(orderId);

    if (!availableActions.canPrecheck) {
      throw new BadRequestException(
        "errors.order-actions.cant-create-precheck",
      );
    }

    const order = await this.pg.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, orderId),
      columns: {
        id: true,
        type: true,
        restaurantId: true,
        currency: true,
      },
      with: {
        orderDishes: {
          where: (orderDishes, { eq, and, gt }) =>
            and(eq(orderDishes.isRemoved, false), gt(orderDishes.quantity, 0)),
          columns: {
            name: true,
            quantity: true,
            price: true,
            discountAmount: true,
            surchargeAmount: true,
            finalPrice: true,
          },
        },
        restaurant: {
          columns: {
            legalEntity: true,
            currency: true,
          },
        },
      },
    });

    if (!order) {
      throw new BadRequestException();
    }

    const precheck = await this.pg.transaction(async (tx) => {
      const { type, restaurant, currency } = order;

      const [precheck] = await tx
        .insert(orderPrechecks)
        .values({
          orderId,
          type,
          legalEntity: restaurant?.legalEntity ?? "",
          locale: "ru",
          currency,
          workerId: opts.worker.id,
        })
        .returning({
          id: orderPrechecks.id,
          createdAt: orderPrechecks.createdAt,
        });

      await tx.insert(orderPrecheckPositions).values(
        order.orderDishes.map((d) => ({
          precheckId: precheck.id,
          ...d,
        })),
      );

      await tx.insert(orderHistoryRecords).values({
        id: precheck.id,
        orderId,
        type: "precheck",
        createdAt: precheck.createdAt,
        workerId: opts.worker.id,
      });

      return precheck;
    });

    const result = await this.pg.query.orderPrechecks.findFirst({
      where: (orderPrechecks, { eq }) => eq(orderPrechecks.id, precheck.id),
      with: {
        worker: {
          columns: {
            name: true,
            role: true,
          },
        },
        positions: true,
        order: {
          columns: {
            number: true,
          },
        },
      },
    });

    if (!result) {
      throw new ServerErrorException();
    }

    return result;
  }
}
