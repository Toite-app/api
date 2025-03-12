import {
  IPagination,
  PAGINATION_DEFAULT_LIMIT,
} from "@core/decorators/pagination.decorator";
import { ForbiddenException } from "@core/errors/exceptions/forbidden.exception";
import { RequestWorker } from "@core/interfaces/request";
import { Inject, Injectable } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import { workshifts } from "@postgress-db/schema/workshifts";
import { and, count, desc, inArray, SQL } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { WorkshiftEntity } from "src/workshifts/entity/workshift.entity";

@Injectable()
export class WorkshiftsService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Builds the where clause for the workshifts query based on the worker's role
   * @param worker - The worker who is requesting the workshifts
   * @returns The where clause for the workshifts query
   */
  private _buildWorkerWhere(worker: RequestWorker) {
    const conditions: SQL[] = [];

    if (worker.role === "SYSTEM_ADMIN" || worker.role === "CHIEF_ADMIN") {
    } else if (worker.role === "OWNER") {
      // For owner, we only want to see workshifts for their restaurants
      conditions.push(
        inArray(
          workshifts.restaurantId,
          worker.ownedRestaurants.map((r) => r.id),
        ),
      );
    } else if (worker.role === "ADMIN" || worker.role === "CASHIER") {
      // Only assigned to worker restaurants
      conditions.push(
        inArray(
          workshifts.restaurantId,
          worker.workersToRestaurants.map((r) => r.restaurantId),
        ),
      );
    } else {
      throw new ForbiddenException();
    }

    return conditions;
  }

  public async getTotalCount(options: {
    worker: RequestWorker;
  }): Promise<number> {
    const { worker } = options;

    const conditions: SQL[] = [...this._buildWorkerWhere(worker)];

    const query = this.pg
      .select({
        value: count(),
      })
      .from(workshifts);

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    return await query.then((res) => res[0].value);
  }

  /**
   * Finds all workshifts
   * @param options - Options for finding workshifts
   * @param options.worker - Worker who is requesting the workshifts
   * @param options.pagination - Pagination options
   * @returns Array of workshifts
   */
  public async findMany(options: {
    worker: RequestWorker;
    pagination?: IPagination;
  }): Promise<WorkshiftEntity[]> {
    const { worker, pagination } = options;

    const conditions: SQL[] = [
      // Worker
      ...this._buildWorkerWhere(worker),
    ];

    const result = await this.pg.query.workshifts.findMany({
      where: (_, { and }) => and(...conditions),
      with: {
        restaurant: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [desc(workshifts.createdAt)],
      limit: pagination?.size ?? PAGINATION_DEFAULT_LIMIT,
      offset: pagination?.offset ?? 0,
    });

    return result;
  }
}
