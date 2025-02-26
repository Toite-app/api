import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { NotFoundException } from "@core/errors/exceptions/not-found.exception";
import { Inject, Injectable } from "@nestjs/common";
import { Schema } from "@postgress-db/drizzle.module";
import { dishModifiersToOrderDishes } from "@postgress-db/schema/dish-modifiers";
import { orderDishes } from "@postgress-db/schema/order-dishes";
import { eq, sql } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { AddOrderDishDto } from "src/orders/@/dtos/add-order-dish.dto";
import { PutOrderDishModifiersDto } from "src/orders/@/dtos/put-order-dish-modifiers";
import { UpdateOrderDishDto } from "src/orders/@/dtos/update-order-dish.dto";
import { OrderPricesService } from "src/orders/@/services/order-prices.service";
import { OrdersQueueProducer } from "src/orders/@queue/orders-queue.producer";

@Injectable()
export class OrderDishesService {
  constructor(
    @Inject(PG_CONNECTION)
    private readonly pg: NodePgDatabase<Schema>,
    private readonly ordersProducer: OrdersQueueProducer,
    private readonly orderPricesService: OrderPricesService,
  ) {}

  private readonly getOrderStatement = this.pg.query.orders
    .findFirst({
      where: (orders, { eq, and }) =>
        and(
          eq(orders.id, sql.placeholder("orderId")),
          eq(orders.isRemoved, false),
          eq(orders.isArchived, false),
        ),
      columns: {
        restaurantId: true,
      },
    })
    .prepare(`${OrderDishesService.name}_getOrder`);

  private async getOrder(orderId: string) {
    const order = await this.getOrderStatement.execute({
      orderId,
    });

    if (!order) {
      throw new NotFoundException("errors.order-dishes.order-not-found");
    }

    if (!order.restaurantId) {
      throw new BadRequestException(
        "errors.order-dishes.restaurant-not-assigned",
      );
    }

    return order;
  }

  public async getOrderDish(orderDishId: string) {
    const orderDish = await this.pg.query.orderDishes.findFirst({
      where: (orderDishes, { eq }) => eq(orderDishes.id, orderDishId),
    });

    if (!orderDish) {
      throw new NotFoundException("errors.order-dishes.order-dish-not-found");
    }

    return orderDish;
  }

  public async getDishForRestaurant(dishId: string, restaurantId: string) {
    const dish = await this.pg.query.dishes.findFirst({
      where: (dishes, { eq }) => eq(dishes.id, dishId),
      with: {
        dishesToRestaurants: {
          where: (dishesToRestaurants, { eq }) =>
            eq(dishesToRestaurants.restaurantId, restaurantId),
          columns: {
            price: true,
            currency: true,
            isInStopList: true,
          },
        },
      },
      columns: {
        name: true,
      },
    });

    if (!dish) {
      throw new NotFoundException("errors.order-dishes.dish-not-found");
    }

    if (dish.dishesToRestaurants.length === 0) {
      throw new NotFoundException("errors.order-dishes.dish-not-assigned");
    }

    return {
      ...dish,
      ...dish.dishesToRestaurants[0],
    };
  }

  public async getIsAdditional(orderId: string, dishId: string) {
    const existing = await this.pg.query.orderDishes.findMany({
      where: (orderDishes, { and, eq, isNull }) =>
        and(
          eq(orderDishes.orderId, orderId),
          eq(orderDishes.dishId, dishId),
          // Exclude removed
          isNull(orderDishes.removedAt),
          eq(orderDishes.isRemoved, false),
        ),
      columns: {
        status: true,
      },
    });

    if (existing.length === 0) {
      return false;
    }

    // If none is pending, then it's additional (cause other are in process or already completed)
    if (existing.every(({ status }) => status !== "pending")) {
      return true;
    }

    if (existing.some(({ status }) => status === "pending")) {
      throw new BadRequestException(
        "errors.order-dishes.dish-already-in-order",
      );
    }

    return true;
  }

  public async addToOrder(
    orderId: string,
    payload: AddOrderDishDto,
    opts?: { workerId?: string },
  ) {
    const { dishId, quantity } = payload;

    const order = await this.getOrder(orderId);
    const dish = await this.getDishForRestaurant(
      payload.dishId,
      String(order.restaurantId),
    );

    const isAdditional = await this.getIsAdditional(orderId, dishId);

    const price = Number(dish.price);

    const orderDish = await this.pg.transaction(async (tx) => {
      const [orderDish] = await tx
        .insert(orderDishes)
        .values({
          orderId,
          dishId: payload.dishId,
          name: dish.name,
          status: "pending",
          quantity,
          isAdditional,
          price: String(price),
          finalPrice: String(price),
        })
        .returning();

      await this.orderPricesService.calculateOrderTotals(orderId, {
        tx,
      });

      return orderDish;
    });

    await this.ordersProducer.dishCrudUpdate({
      action: "CREATE",
      orderDishId: orderDish.id,
      orderDish,
      calledByWorkerId: opts?.workerId,
    });

    return orderDish;
  }

  public async update(
    orderDishId: string,
    payload: UpdateOrderDishDto,
    opts?: { workerId?: string },
  ) {
    const { quantity } = payload;

    if (quantity <= 0) {
      throw new BadRequestException(
        "errors.order-dishes.cant-set-zero-quantity",
      );
    }

    const orderDish = await this.getOrderDish(orderDishId);

    if (orderDish.status !== "pending") {
      throw new BadRequestException(
        "errors.order-dishes.cant-update-not-pending-order-dish",
      );
    }

    if (orderDish.isRemoved) {
      throw new BadRequestException("errors.order-dishes.is-removed");
    }

    const updatedOrderDish = await this.pg.transaction(async (tx) => {
      const [updatedOrderDish] = await tx
        .update(orderDishes)
        .set({
          quantity,
        })
        .where(eq(orderDishes.id, orderDishId))
        .returning();

      await this.orderPricesService.calculateOrderTotals(orderDish.orderId, {
        tx,
      });

      return updatedOrderDish;
    });

    await this.ordersProducer.dishCrudUpdate({
      action: "UPDATE",
      orderDishId: orderDish.id,
      orderDish: updatedOrderDish,
      calledByWorkerId: opts?.workerId,
    });

    return updatedOrderDish;
  }

  public async remove(orderDishId: string, opts?: { workerId?: string }) {
    const orderDish = await this.getOrderDish(orderDishId);

    if (orderDish.isRemoved) {
      throw new BadRequestException("errors.order-dishes.already-removed");
    }

    const removedOrderDish = await this.pg.transaction(async (tx) => {
      const [removedOrderDish] = await tx
        .update(orderDishes)
        .set({ isRemoved: true, removedAt: new Date() })
        .where(eq(orderDishes.id, orderDishId))
        .returning();

      await this.orderPricesService.calculateOrderTotals(orderDish.orderId, {
        tx,
      });

      return removedOrderDish;
    });

    await this.ordersProducer.dishCrudUpdate({
      action: "DELETE",
      orderDishId: orderDish.id,
      orderDish: removedOrderDish,
      calledByWorkerId: opts?.workerId,
    });

    return removedOrderDish;
  }

  public async updateDishModifiers(
    orderDishId: string,
    payload: PutOrderDishModifiersDto,
  ) {
    const orderDish = await this.getOrderDish(orderDishId);

    if (orderDish.isRemoved) {
      throw new BadRequestException("errors.order-dishes.is-removed");
    }

    if (orderDish.status !== "pending" && orderDish.status !== "cooking") {
      throw new BadRequestException(
        "errors.order-dishes.cant-update-ready-dish",
      );
    }

    const order = await this.getOrder(orderDish.orderId);

    const dishModifiers = await this.pg.query.dishModifiers.findMany({
      where: (dishModifiers, { inArray, and, eq }) =>
        and(
          inArray(dishModifiers.id, payload.dishModifierIds),
          eq(dishModifiers.isActive, true),
          eq(dishModifiers.isRemoved, false),
        ),
      columns: {
        id: true,
        restaurantId: true,
      },
    });

    if (
      dishModifiers.some(
        ({ restaurantId }) => restaurantId !== order.restaurantId,
      )
    ) {
      throw new BadRequestException(
        "errors.order-dish-modifiers.some-dish-modifiers-not-assigned-to-restaurant",
      );
    }

    if (dishModifiers.length !== payload.dishModifierIds.length) {
      throw new BadRequestException(
        "errors.order-dish-modifiers.some-dish-modifiers-not-found",
      );
    }

    await this.pg.transaction(async (tx) => {
      // Delete all existing dish modifiers for this order dish
      await tx
        .delete(dishModifiersToOrderDishes)
        .where(eq(dishModifiersToOrderDishes.orderDishId, orderDishId));

      // Insert new dish modifiers for this order dish
      if (payload.dishModifierIds.length > 0) {
        await tx.insert(dishModifiersToOrderDishes).values(
          dishModifiers.map(({ id }) => ({
            dishModifierId: id,
            orderDishId,
          })),
        );
      }
    });

    return orderDish;
  }
}
