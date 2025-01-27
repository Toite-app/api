import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { NotFoundException } from "@core/errors/exceptions/not-found.exception";
import { Inject, Injectable } from "@nestjs/common";
import { Schema } from "@postgress-db/drizzle.module";
import { orderDishes } from "@postgress-db/schema/order-dishes";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { AddOrderDishDto } from "src/orders/@/dtos/add-order-dish.dto";

@Injectable()
export class OrderDishesService {
  constructor(
    @Inject(PG_CONNECTION)
    private readonly pg: NodePgDatabase<Schema>,
  ) {}

  private async getOrder(orderId: string) {
    const order = await this.pg.query.orders.findFirst({
      where: (orders, { eq, and }) =>
        and(
          eq(orders.id, orderId),
          eq(orders.isRemoved, false),
          eq(orders.isArchived, false),
        ),
      columns: {
        restaurantId: true,
      },
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

  public async addToOrder(orderId: string, payload: AddOrderDishDto) {
    const { dishId, quantity } = payload;

    const order = await this.getOrder(orderId);
    const dish = await this.getDishForRestaurant(
      payload.dishId,
      String(order.restaurantId),
    );

    const isAdditional = await this.getIsAdditional(orderId, dishId);

    const price = Number(dish.price);

    const [orderDish] = await this.pg
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
      .returning({
        id: orderDishes.id,
      });

    return orderDish;
  }
}
