import { Inject, Injectable, Logger } from "@nestjs/common";
import { DrizzleTransaction, Schema } from "@postgress-db/drizzle.module";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { OrdersRepository } from "src/orders/@/repositories/orders.repository";

@Injectable()
export class OrderUpdatersService {
  private readonly logger = new Logger(OrderUpdatersService.name);

  constructor(
    @Inject(PG_CONNECTION)
    private readonly pg: NodePgDatabase<Schema>,
    private readonly repository: OrdersRepository,
  ) {}

  public async checkDishesReadyStatus(
    orderId: string,
    opts?: { tx?: DrizzleTransaction },
  ) {
    const tx = opts?.tx ?? this.pg;

    const order = await tx.query.orders.findFirst({
      where: (orders, { and, eq }) =>
        and(eq(orders.id, orderId), eq(orders.status, "cooking")),
      columns: {},
      with: {
        orderDishes: {
          where: (orderDishes, { eq, and, gt }) =>
            and(eq(orderDishes.isRemoved, false), gt(orderDishes.quantity, 0)),
          columns: {
            status: true,
          },
        },
      },
    });

    if (!order) return;

    if (order.orderDishes.every((d) => d.status === "ready")) {
      await this.repository.update(
        orderId,
        {
          status: "ready",
        },
        {
          tx: opts?.tx,
        },
      );
    }
  }

  public async calculateOrderTotals(
    orderId: string,
    opts?: {
      tx?: DrizzleTransaction;
    },
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

    await this.repository.update(
      orderId,
      {
        subtotal: prices.subtotal.toString(),
        surchargeAmount: prices.surchargeAmount.toString(),
        discountAmount: prices.discountAmount.toString(),
        total: prices.total.toString(),
      },
      {
        tx: opts?.tx,
      },
    );
  }
}
