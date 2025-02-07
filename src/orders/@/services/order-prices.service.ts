import { Inject, Injectable, Logger } from "@nestjs/common";
import { DrizzleTransaction, Schema } from "@postgress-db/drizzle.module";
import { orders } from "@postgress-db/schema/orders";
import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";

@Injectable()
export class OrderPricesService {
  private readonly logger = new Logger(OrderPricesService.name);

  constructor(
    @Inject(PG_CONNECTION)
    private readonly pg: NodePgDatabase<Schema>,
  ) {}

  public async calculateOrderTotals(
    orderId: string,
    opts?: { tx?: DrizzleTransaction },
  ) {
    const tx = opts?.tx ?? this.pg;

    const orderDishes = await tx.query.orderDishes.findMany({
      where: (orderDishes, { eq, and, gt }) =>
        and(
          eq(orderDishes.orderId, orderId),
          eq(orderDishes.isRemoved, false),
          gt(orderDishes.quantity, 0),
        ),
      columns: {
        price: true,
        quantity: true,
        finalPrice: true,
        surchargeAmount: true,
        discountAmount: true,
      },
    });

    if (!orderDishes.length) {
      this.logger.warn(`No dishes found for order ${orderId}`);
      return;
    }

    const prices = orderDishes.reduce(
      (acc, dish) => {
        acc.subtotal += Number(dish.price) * Number(dish.quantity);
        acc.surchargeAmount +=
          Number(dish.surchargeAmount) * Number(dish.quantity);
        acc.discountAmount +=
          Number(dish.discountAmount) * Number(dish.quantity);
        acc.total += Number(dish.finalPrice) * Number(dish.quantity);
        return acc;
      },
      { subtotal: 0, surchargeAmount: 0, discountAmount: 0, total: 0 },
    );

    await tx
      .update(orders)
      .set({
        subtotal: prices.subtotal.toString(),
        surchargeAmount: prices.surchargeAmount.toString(),
        discountAmount: prices.discountAmount.toString(),
        total: prices.total.toString(),
      })
      .where(eq(orders.id, orderId));
  }
}
