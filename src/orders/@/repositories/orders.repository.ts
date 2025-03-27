import { Inject, Injectable } from "@nestjs/common";
import { DrizzleTransaction, Schema } from "@postgress-db/drizzle.module";
import { orderHistoryRecords } from "@postgress-db/schema/order-history";
import { orders } from "@postgress-db/schema/orders";
import { plainToClass } from "class-transformer";
import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { SnapshotsProducer } from "src/@base/snapshots/snapshots.producer";
import { PG_CONNECTION } from "src/constants";
import { OrderSnapshotEntity } from "src/orders/@/entities/order-snapshot.entity";

@Injectable()
export class OrdersRepository {
  constructor(
    // Postgres connection
    @Inject(PG_CONNECTION)
    private readonly pg: NodePgDatabase<Schema>,
    // Services
    private readonly snapshotsProducer: SnapshotsProducer,
  ) {}

  /**
   * Proceeds data for snapshot. Excludes extraneous values
   * @param result
   * @returns
   */
  private _proceedForSnapshot(result: typeof orders.$inferSelect) {
    return plainToClass(OrderSnapshotEntity, result, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Creates new order
   * @param payload - Order data
   * @param opts - Transaction options
   * @returns Created order
   */
  public async create(
    payload: typeof orders.$inferInsert,
    opts?: {
      tx?: DrizzleTransaction;
      workerId?: string;
    },
  ) {
    const tx = opts?.tx ?? this.pg;

    const result = await tx.transaction(async (tx) => {
      // Insert new data to database
      const [createdOrder] = await tx
        .insert(orders)
        .values(payload)
        .returning();

      // Create history record
      await tx.insert(orderHistoryRecords).values({
        orderId: createdOrder.id,
        type: "created",
        workerId: opts?.workerId,
      });

      return createdOrder;
    });

    // Create snapshot
    await this.snapshotsProducer.create({
      model: "ORDERS",
      action: "CREATE",
      documentId: result.id,
      data: this._proceedForSnapshot(result),
      workerId: opts?.workerId,
    });

    return result;
  }

  /**
   * Updates order
   * @param orderId - Order ID
   * @param payload - Partial order data
   * @param opts - Transaction options
   * @returns Updated order
   */
  public async update(
    orderId: string,
    payload: Partial<typeof orders.$inferInsert>,
    opts?: { tx?: DrizzleTransaction; workerId?: string },
  ) {
    const tx = opts?.tx ?? this.pg;

    const result = await tx.transaction(async (tx) => {
      // Update order
      const [updatedOrder] = await tx
        .update(orders)
        .set(payload)
        .where(eq(orders.id, orderId))
        .returning();

      return updatedOrder;
    });

    // Create snapshot
    await this.snapshotsProducer.create({
      model: "ORDERS",
      action: "UPDATE",
      documentId: result.id,
      data: this._proceedForSnapshot(result),
      workerId: opts?.workerId,
    });

    return result;
  }
}
