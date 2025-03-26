import { ICursor } from "@core/decorators/cursor.decorator";
import { Inject, Injectable } from "@nestjs/common";
import { Schema } from "@postgress-db/drizzle.module";
import { orderDishes } from "@postgress-db/schema/order-dishes";
import { OrderTypeEnum } from "@postgress-db/schema/order-enums";
import { addDays } from "date-fns";
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
    type?: OrderTypeEnum;
    restaurantId?: string;
  }): Promise<DispatcherOrderEntity[]> {
    const { cursor, type, restaurantId } = options ?? {};

    const fetchedOrders = await this.pg.query.orders.findMany({
      where: (orders, { eq, and, lt, isNull, or, isNotNull }) =>
        and(
          // Exclude archived orders
          eq(orders.isArchived, false),
          // Exclude removed orders
          eq(orders.isRemoved, false),
          // Exclude pending delayed orders
          or(
            and(
              isNotNull(orders.delayedTo),
              lt(orders.delayedTo, addDays(new Date(), 1)),
            ),
            isNull(orders.delayedTo),
          ),
          // Cursor pagination
          cursor?.cursorId
            ? lt(orders.createdAt, new Date(cursor.cursorId))
            : undefined,
          // Filter by type
          !!type ? eq(orders.type, type) : undefined,
          // Filter by restaurantId
          !!restaurantId ? eq(orders.restaurantId, restaurantId) : undefined,
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
          where: (orderDishes, { eq }) => eq(orderDishes.isRemoved, false),
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

  async findManyAttentionRequired(options?: {
    type?: OrderTypeEnum;
    restaurantId?: string;
  }) {
    const { type, restaurantId } = options ?? {};

    const fetchedOrders = await this.pg.query.orders.findMany({
      where: (
        orders,
        { eq, and, lt, or, isNotNull, isNull, notInArray, exists },
      ) =>
        and(
          // Filter by restaurantId
          !!restaurantId ? eq(orders.restaurantId, restaurantId) : undefined,
          // Check if the order is delayed and the delay time is in the past
          or(
            // If restaurant is not set attention is still required even if the order is delayed
            isNull(orders.restaurantId),
            and(
              isNotNull(orders.delayedTo),
              lt(orders.delayedTo, addDays(new Date(), 1)),
            ),
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
                    eq(orderDishes.isRemoved, false),
                  ),
                ),
            ),
          ),
          // Exclude archived orders
          eq(orders.isArchived, false),
          // Exclude cancelled and completed orders
          notInArray(orders.status, ["cancelled", "completed"]),
          // Filter by type
          !!type ? eq(orders.type, type) : undefined,
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
          where: (orderDishes, { eq }) => eq(orderDishes.isRemoved, false),
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

  async findManyDelayed(options?: {
    type?: OrderTypeEnum;
    restaurantId?: string;
  }) {
    const { type, restaurantId } = options ?? {};

    const fetchedOrders = await this.pg.query.orders.findMany({
      where: (orders, { eq, and, gt, isNotNull }) =>
        and(
          // Filter by restaurantId
          !!restaurantId ? eq(orders.restaurantId, restaurantId) : undefined,
          // Exclude archived orders
          eq(orders.isArchived, false),
          // Exclude removed orders
          eq(orders.isRemoved, false),
          // Delayed orders condition
          and(
            isNotNull(orders.delayedTo),
            gt(orders.delayedTo, addDays(new Date(), 1)),
          ),
          // Filter by type
          !!type ? eq(orders.type, type) : undefined,
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
          where: (orderDishes, { eq }) => eq(orderDishes.isRemoved, false),
          columns: {
            status: true,
          },
        },
      },
      orderBy: (orders, { asc }) => [asc(orders.delayedTo)],
      limit: 100,
    });

    return this.attachRestaurantsName(fetchedOrders);
  }
}
