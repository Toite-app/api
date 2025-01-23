import { ICursor } from "@core/decorators/cursor.decorator";
import { Inject, Injectable } from "@nestjs/common";
import { Schema } from "@postgress-db/drizzle.module";
import { orderDishes } from "@postgress-db/schema/order-dishes";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { DispatcherOrderEntity } from "src/orders/dispatcher/entities/dispatcher-order.entity";

@Injectable()
export class DispatcherOrdersService {
  constructor(
    @Inject(PG_CONNECTION)
    private readonly pg: NodePgDatabase<Schema>,
  ) {}

  private attachRestaurantsName<
    T extends { restaurant?: { name?: string | null } | null },
  >(orders: Array<T>): Array<T & { restaurantName: string | null }> {
    return orders.map((order) => ({
      ...order,
      restaurantName: order.restaurant?.name ?? null,
    }));
  }

  async findMany(options?: {
    cursor?: ICursor;
  }): Promise<DispatcherOrderEntity[]> {
    const { cursor } = options ?? {};

    const fetchedOrders = await this.pg.query.orders.findMany({
      where: (orders, { eq, and, lt, isNull, or, isNotNull }) =>
        and(
          // Exclude archived orders
          eq(orders.isArchived, false),
          // Exclude removed orders
          eq(orders.isRemoved, false),
          // Exclude pending delayed orders
          or(
            and(isNotNull(orders.delayedTo), lt(orders.delayedTo, new Date())),
            isNull(orders.delayedTo),
          ),
          // Cursor pagination
          cursor?.cursorId
            ? lt(orders.createdAt, new Date(cursor.cursorId))
            : undefined,
        ),
      with: {
        // Restaurant for restaurantName
        restaurant: {
          columns: {
            name: true,
          },
        },
        // Order dishes for statuses
        orderDishes: {
          columns: {
            status: true,
          },
        },
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      limit: cursor?.limit ?? 100,
    });

    return this.attachRestaurantsName(fetchedOrders);
  }

  async findManyAttentionRequired() {
    const fetchedOrders = await this.pg.query.orders.findMany({
      where: (
        orders,
        { eq, and, lt, or, isNotNull, isNull, notInArray, exists },
      ) =>
        and(
          // Check if the order is delayed and the delay time is in the past
          or(
            and(isNotNull(orders.delayedTo), lt(orders.delayedTo, new Date())),
            isNull(orders.delayedTo),
          ),
          or(
            // If the restaurant is not set
            isNull(orders.restaurantId),
            // If some dishes are pending
            exists(
              this.pg
                .select({ id: orderDishes.id })
                .from(orderDishes)
                .where(
                  and(
                    eq(orderDishes.orderId, orders.id),
                    eq(orderDishes.status, "pending"),
                  ),
                ),
            ),
          ),
          // Exclude archived orders
          eq(orders.isArchived, false),
          // Exclude cancelled and completed orders
          notInArray(orders.status, ["cancelled", "completed"]),
        ),
      with: {
        // Restaurant for restaurantName
        restaurant: {
          columns: {
            name: true,
          },
        },
        // Order dishes for statuses
        orderDishes: {
          columns: {
            status: true,
          },
        },
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      limit: 100,
    });

    return this.attachRestaurantsName(fetchedOrders);
  }

  async findManyDelayed() {
    const fetchedOrders = await this.pg.query.orders.findMany({
      where: (orders, { eq, and, gt, isNotNull }) =>
        and(
          // Exclude archived orders
          eq(orders.isArchived, false),
          // Exclude removed orders
          eq(orders.isRemoved, false),
          // Delayed orders condition
          and(isNotNull(orders.delayedTo), gt(orders.delayedTo, new Date())),
        ),
      with: {
        // Restaurant for restaurantName
        restaurant: {
          columns: {
            name: true,
          },
        },
        // Order dishes for statuses
        orderDishes: {
          columns: {
            status: true,
          },
        },
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      limit: 100,
    });

    return this.attachRestaurantsName(fetchedOrders);
  }
}
