import { Inject, Injectable } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";

@Injectable()
export class OrderDiscountsService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
  ) {}

  public async getOrderDiscounts(orderId: string) {
    const order = await this.pg.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, orderId),
      columns: {
        type: true,
        from: true,
        guestId: true,
        restaurantId: true,
      },
    });

    if (!order) {
      return [];
    }

    const discounts = await this.pg.query.discounts.findMany({
      where: (discounts, { or, eq, exists, ilike, and, inArray }) =>
        or(
          and(
            // Order from in array //
            ilike(discounts.orderFroms, order.from),
          ),
        ),
    });
  }
}
