import { ICursor } from "@core/decorators/cursor.decorator";
import { Inject, Injectable } from "@nestjs/common";
import { Schema } from "@postgress-db/drizzle.module";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { DispatcherOrderEntity } from "src/orders/dispatcher/entities/dispatcher-order.entity";

@Injectable()
export class DispatcherOrdersService {
  constructor(
    @Inject(PG_CONNECTION)
    private readonly pg: NodePgDatabase<Schema>,
  ) {}

  async findMany(options?: {
    cursor?: ICursor;
  }): Promise<DispatcherOrderEntity[]> {
    const { cursor } = options ?? {};

    const fetchedOrders = await this.pg.query.orders.findMany({
      where: (orders, { eq, and, lt }) =>
        and(
          eq(orders.isArchived, false),
          eq(orders.isRemoved, false),
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
      orderBy: (orders, { asc, desc }) => [
        desc(orders.createdAt),
        asc(orders.id),
      ],
      limit: cursor?.limit ?? 100,
    });

    return fetchedOrders.map((order) => ({
      ...order,
      restaurantName: order.restaurant?.name ?? null,
    }));
  }
}
