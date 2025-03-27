import { Inject, Injectable } from "@nestjs/common";
import { DrizzleTransaction, schema } from "@postgress-db/drizzle.module";
import { orderHistoryRecords } from "@postgress-db/schema/order-history";
import { count, eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { OrderHistoryRecordEntity } from "src/orders/@/entities/order-history-record.entity";
import { OrderHistoryEntity } from "src/orders/@/entities/order-history.entity";
import { OrderPrecheckEntity } from "src/orders/@/entities/order-precheck.entity";

@Injectable()
export class OrderHistoryService {
  constructor(
    // DB Connection
    @Inject(PG_CONNECTION)
    private readonly pg: NodePgDatabase<typeof schema>,
  ) {}

  /**
   *
   * @param tx
   * @param precheckIds
   * @returns
   */
  private async _getPrechecks(
    tx: DrizzleTransaction,
    precheckIds: string[],
  ): Promise<OrderPrecheckEntity[]> {
    if (precheckIds.length === 0) {
      return [];
    }

    return await this.pg.query.orderPrechecks.findMany({
      where: (prechecks, { inArray }) => inArray(prechecks.id, precheckIds),
      with: {
        worker: {
          columns: {
            name: true,
            role: true,
          },
        },
        positions: true,
        order: {
          columns: {
            number: true,
          },
        },
      },
    });
  }

  /**
   *
   * @param tx
   * @param records
   * @returns
   */
  private async _assignDataToRecords(
    tx: DrizzleTransaction,
    records: OrderHistoryRecordEntity[],
  ): Promise<OrderHistoryEntity[]> {
    const dataMap = new Map<string, unknown>();
    const precheckIdsSet = new Set<string>();

    records.forEach((record) => {
      if (record.type === "precheck") {
        precheckIdsSet.add(record.id);
      }
    });

    const prechecks = await this._getPrechecks(tx, Array.from(precheckIdsSet));

    prechecks.forEach((precheck) => {
      dataMap.set(precheck.id, precheck);
    });

    return records.map((record) => {
      return {
        ...record,
        precheck: null,
        // If record is a precheck, add the precheck data
        ...(record.type === "precheck" && {
          precheck: (dataMap.get(record.id) ||
            null) as OrderPrecheckEntity | null,
        }),
      };
    });
  }

  public async getTotalCount(orderId: string): Promise<number> {
    const [result] = await this.pg
      .select({
        count: count(),
      })
      .from(orderHistoryRecords)
      .where(eq(orderHistoryRecords.orderId, orderId));

    return result?.count || 0;
  }

  /**
   * Finds all history records for an order
   * @param orderId
   * @param options
   * @returns
   */
  public async findMany(
    orderId: string,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<OrderHistoryEntity[]> {
    // Pagination
    const { limit, offset } = options || {
      limit: 50,
      offset: 0,
    };

    const history = await this.pg.transaction(async (tx) => {
      // Get records to then fetch their data
      const records = await tx.query.orderHistoryRecords.findMany({
        where: (records, { eq }) => eq(records.orderId, orderId),
        limit,
        offset,
        // From newest to oldest
        orderBy: (records, { desc }) => desc(records.createdAt),
        columns: {
          id: true,
          orderId: true,
          type: true,
          workerId: true,
          createdAt: true,
        },
        with: {
          worker: {
            columns: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      return this._assignDataToRecords(tx, records);
    });

    return history;
  }
}
