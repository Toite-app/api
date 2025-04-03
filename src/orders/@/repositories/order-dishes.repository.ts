import { Inject, Injectable } from "@nestjs/common";
import { DrizzleTransaction, Schema } from "@postgress-db/drizzle.module";
import { orderDishes } from "@postgress-db/schema/order-dishes";
import { plainToClass } from "class-transformer";
import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { SnapshotsProducer } from "src/@base/snapshots/snapshots.producer";
import { PG_CONNECTION } from "src/constants";
import { OrderDishSnapshotEntity } from "src/orders/@/entities/order-dish-snapshot.entity";
import { OrderUpdatersService } from "src/orders/@/services/order-updaters.service";

export type OrderDishUpdatePayload = {
  orderDishId: string;
} & Partial<typeof orderDishes.$inferInsert>;

@Injectable()
export class OrderDishesRepository {
  constructor(
    // Postgres connection
    @Inject(PG_CONNECTION)
    private readonly pg: NodePgDatabase<Schema>,
    // Services
    private readonly orderUpdatersService: OrderUpdatersService,
    private readonly snapshotsProducer: SnapshotsProducer,
  ) {}

  /**
   * Proceeds data for snapshot. Excludes extraneous values
   * @param result
   * @returns
   */
  private _proceedForSnapshot(result: typeof orderDishes.$inferSelect) {
    return plainToClass(OrderDishSnapshotEntity, result, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Creates new order dish. Without any checks, just data handling (including snapshot)
   * @param payload - Order dish data
   * @param opts - Transaction options
   * @returns Created order dish
   */
  public async create(
    payload: typeof orderDishes.$inferInsert,
    opts?: {
      tx?: DrizzleTransaction;
      workerId?: string;
    },
  ) {
    const tx = opts?.tx ?? this.pg;

    const result = await tx.transaction(async (tx) => {
      // Insert new data to database
      const [orderDish] = await tx
        .insert(orderDishes)
        .values(payload)
        .returning();

      // Calculate order totals price
      await this.orderUpdatersService.calculateOrderTotals(orderDish.orderId, {
        tx,
      });

      return orderDish;
    });

    // Create snapshot
    await this.snapshotsProducer.create({
      model: "ORDER_DISHES",
      action: "CREATE",
      documentId: result.id,
      data: this._proceedForSnapshot(result),
      workerId: opts?.workerId,
    });

    return result;
  }

  /**
   * Updates order dish
   * @param orderDishId - Order dish ID
   * @param payload - Partial order dish data
   * @param opts - Transaction options
   * @returns Updated order dish
   */
  public async update(
    orderDishId: string,
    payload: Omit<OrderDishUpdatePayload, "orderDishId">,
    opts?: {
      tx?: DrizzleTransaction;
      workerId?: string;
      _ignoreHandlers?: boolean;
    },
  ) {
    const tx = opts?.tx ?? this.pg;

    const result = await tx.transaction(async (tx) => {
      // Update order dish
      const [orderDish] = await tx
        .update(orderDishes)
        .set(payload)
        .where(eq(orderDishes.id, orderDishId))
        .returning();

      if (!opts?._ignoreHandlers) {
        // When order dish is ready check for others and set order status
        if (payload?.status && payload.status === "ready") {
          await this.orderUpdatersService.checkDishesReadyStatus(
            orderDish.orderId,
            {
              tx,
            },
          );
        }

        // Calculate order totals price
        await this.orderUpdatersService.calculateOrderTotals(
          orderDish.orderId,
          {
            tx,
          },
        );
      }

      return orderDish;
    });

    // Create snapshot
    await this.snapshotsProducer.create({
      model: "ORDER_DISHES",
      action: "UPDATE",
      documentId: result.id,
      data: this._proceedForSnapshot(result),
      workerId: opts?.workerId,
    });

    return result;
  }

  public async updateMany(
    payload: (OrderDishUpdatePayload | null)[],
    opts?: {
      tx?: DrizzleTransaction;
      workerId?: string;
    },
  ) {
    const tx = opts?.tx ?? this.pg;

    const results = await tx.transaction(async (tx) => {
      const results = await Promise.all(
        payload
          .filter((od) => od !== null)
          .map((od) => od as OrderDishUpdatePayload)
          .map(({ orderDishId, ...data }, index) => {
            return this.update(orderDishId, data, {
              tx,
              _ignoreHandlers: index !== payload.length - 1,
              workerId: opts?.workerId,
            });
          }),
      );

      return results;
    });

    return results;
  }
}
