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

  public async addDish(orderId: string, payload: AddOrderDishDto) {
    let isAdditional = false;

    const existing = await this.pg.query.orderDishes.findMany({
      where: (orderDishes, { and, eq, isNull }) =>
        and(
          eq(orderDishes.orderId, orderId),
          eq(orderDishes.dishId, payload.dishId),
          // Exclude removed
          isNull(orderDishes.removedAt),
          eq(orderDishes.isRemoved, false),
        ),
    });

    // If some with same dishId is ready or completed, then we need to add it as additional
    if (
      existing &&
      existing.length > 0 &&
      existing.some(
        ({ status }) => status === "ready" || status === "completed",
      )
    ) {
      isAdditional = true;
    }

    const dish = await this.pg.query.dishes.findFirst({
      where: (dishes, { eq }) => eq(dishes.id, payload.dishId),
      columns: {
        name: true,
      },
    });

    const [createdOrderDish] = await this.pg
      .insert(orderDishes)
      .values({
        orderId,
        dishId: payload.dishId,
        name: dish?.name ?? "",
        status: "pending",
        quantity: payload.quantity,
        isAdditional,
        price: String(0),
        finalPrice: String(0),
      })
      .returning({
        id: orderDishes.id,
      });

    return createdOrderDish.id;
  }
}
