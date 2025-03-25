import {
  IPagination,
  PAGINATION_DEFAULT_LIMIT,
} from "@core/decorators/pagination.decorator";
import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { ForbiddenException } from "@core/errors/exceptions/forbidden.exception";
import { NotFoundException } from "@core/errors/exceptions/not-found.exception";
import { RequestWorker } from "@core/interfaces/request";
import { Inject, Injectable } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import { workshifts } from "@postgress-db/schema/workshifts";
import { and, count, desc, eq, inArray, SQL } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { CreateWorkshiftDto } from "src/workshifts/@/dto/create-workshift.dto";
import { WorkshiftEntity } from "src/workshifts/@/entity/workshift.entity";

import { WorkshiftNavigationEntity } from "../entity/workshift-navigation.entity";

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
    restaurantId?: string;
  }): Promise<number> {
    const { worker, restaurantId } = options;

    const conditions: SQL[] = [...this._buildWorkerWhere(worker)];

    if (restaurantId) {
      conditions.push(eq(workshifts.restaurantId, restaurantId));
    }

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
   * Finds a workshift by id
   * @param options - Options for finding a workshift
   * @param options.worker - Worker who is requesting the workshift
   * @param options.id - Id of the workshift
   * @returns The found workshift or null if not found
   */
  public async findOne(
    id: string,
    options: {
      worker: RequestWorker;
    },
  ): Promise<WorkshiftEntity | null> {
    const { worker } = options;

    const conditions: SQL[] = [
      // Worker
      ...this._buildWorkerWhere(worker),
      eq(workshifts.id, id),
    ];

    const result = await this.pg.query.workshifts.findFirst({
      where: (_, { and }) => and(...conditions),
      with: {
        restaurant: {
          columns: {
            id: true,
            name: true,
            currency: true,
          },
        },
        openedByWorker: {
          columns: {
            id: true,
            name: true,
            role: true,
          },
        },
        closedByWorker: {
          columns: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return result ?? null;
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
    restaurantId?: string;
  }): Promise<WorkshiftEntity[]> {
    const { worker, pagination, restaurantId } = options;

    const conditions: SQL[] = [
      // Worker
      ...this._buildWorkerWhere(worker),
    ];

    if (restaurantId) {
      conditions.push(eq(workshifts.restaurantId, restaurantId));
    }

    const result = await this.pg.query.workshifts.findMany({
      where: (_, { and }) => and(...conditions),
      with: {
        restaurant: {
          columns: {
            id: true,
            name: true,
            currency: true,
          },
        },
        openedByWorker: {
          columns: {
            id: true,
            name: true,
            role: true,
          },
        },
        closedByWorker: {
          columns: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: [desc(workshifts.createdAt), desc(workshifts.id)],
      limit: pagination?.size ?? PAGINATION_DEFAULT_LIMIT,
      offset: pagination?.offset ?? 0,
    });

    return result;
  }

  /**
   * Checks if the worker has enough rights to perform the action
   * @param worker - Worker who is performing the action
   * @param restaurantId - Id of the restaurant
   */
  private _checkRights(worker: RequestWorker, restaurantId: string) {
    if (worker.role === "SYSTEM_ADMIN" || worker.role === "CHIEF_ADMIN") {
    } else if (worker.role === "OWNER") {
      // Check if worker owns the restaurant
      if (!worker.ownedRestaurants.some((r) => r.id === restaurantId)) {
        throw new ForbiddenException("errors.workshifts.not-enough-rights");
      }
    } else if (worker.role === "ADMIN" || worker.role === "CASHIER") {
      // Check if worker is assigned to the restaurant
      if (
        !worker.workersToRestaurants.some(
          (r) => r.restaurantId === restaurantId,
        )
      ) {
        throw new ForbiddenException("errors.workshifts.not-enough-rights");
      }
    } else {
      throw new ForbiddenException("errors.workshifts.not-enough-rights");
    }
  }

  /**
   * Creates a new workshift
   * @param payload - The payload for creating a workshift
   * @param opts - Options for creating a workshift
   * @param opts.worker - Worker who is creating the workshift
   * @returns The created workshift
   */
  public async create(
    payload: CreateWorkshiftDto,
    opts: { worker: RequestWorker },
  ): Promise<WorkshiftEntity> {
    const { restaurantId } = payload;
    const { worker } = opts;

    const restaurant = await this.pg.query.restaurants.findFirst({
      where: (restaurants, { and, eq }) =>
        and(
          eq(restaurants.id, restaurantId),
          // Check that restaurant is enabled and not closed forever
          eq(restaurants.isEnabled, true),
          eq(restaurants.isClosedForever, false),
        ),
    });

    if (!restaurant) {
      throw new NotFoundException("errors.workshifts.restaurant-not-available");
    }

    // Check if worker has enough rights to create workshift for this restaurant
    this._checkRights(worker, restaurantId);

    const [prevWorkshift] = await this.pg.query.workshifts.findMany({
      where: (_, { and, eq }) => and(eq(workshifts.restaurantId, restaurantId)),
      columns: {
        status: true,
      },
      orderBy: [desc(workshifts.createdAt)],
      limit: 1,
    });

    // Prev is opened, so we can't create new one
    if (prevWorkshift && prevWorkshift.status === "OPENED") {
      throw new BadRequestException(
        "errors.workshifts.close-previous-workshift",
      );
    }

    const [createdWorkshift] = await this.pg
      .insert(workshifts)
      .values({
        status: "OPENED",
        restaurantId,
        openedByWorkerId: worker.id,
        openedAt: new Date(),
      })
      .returning({
        id: workshifts.id,
      });

    return (await this.findOne(createdWorkshift.id, {
      worker,
    })) as WorkshiftEntity;
  }

  public async close(
    workshiftId: string,
    opts: { worker: RequestWorker },
  ): Promise<WorkshiftEntity> {
    const { worker } = opts;

    const workshift = await this.pg.query.workshifts.findFirst({
      where: (workshifts, { and, eq }) => and(eq(workshifts.id, workshiftId)),
      columns: {
        status: true,
        restaurantId: true,
      },
    });

    if (!workshift) {
      throw new NotFoundException();
    }

    // Check if worker has enough rights to create workshift for this restaurant
    this._checkRights(worker, workshift.restaurantId);

    if (workshift.status === "CLOSED") {
      throw new BadRequestException(
        "errors.workshifts.workshift-already-closed",
      );
    }

    await this.pg
      .update(workshifts)
      .set({
        status: "CLOSED",
        closedByWorkerId: worker.id,
        closedAt: new Date(),
      })
      .where(eq(workshifts.id, workshiftId));

    return (await this.findOne(workshiftId, {
      worker,
    })) as WorkshiftEntity;
  }

  /**
   * Gets the next and previous workshift IDs for a given workshift
   * @param workshiftId - ID of the current workshift
   * @param options - Options for finding navigation
   * @param options.worker - Worker who is requesting the navigation
   * @returns Object containing next and previous workshift IDs
   */
  public async getNavigation(
    workshiftId: string,
    options: {
      worker: RequestWorker;
    },
  ): Promise<WorkshiftNavigationEntity> {
    const { worker } = options;

    const currentWorkshift = await this.findOne(workshiftId, { worker });

    if (!currentWorkshift) {
      throw new NotFoundException();
    }

    const conditions = [
      ...this._buildWorkerWhere(worker),
      eq(workshifts.restaurantId, currentWorkshift.restaurantId),
    ];

    // Get previous workshift
    const [prevWorkshift] = await this.pg.query.workshifts.findMany({
      where: (workshifts, { and, lt }) =>
        and(
          ...conditions,
          lt(workshifts.createdAt, currentWorkshift.createdAt),
          lt(workshifts.id, currentWorkshift.id),
        ),
      columns: {
        id: true,
      },
      orderBy: [desc(workshifts.createdAt)],
      limit: 1,
    });

    // Get next workshift
    const [nextWorkshift] = await this.pg.query.workshifts.findMany({
      where: (workshifts, { and, gt }) =>
        and(
          ...conditions,
          gt(workshifts.createdAt, currentWorkshift.createdAt),
          gt(workshifts.id, currentWorkshift.id),
        ),
      columns: {
        id: true,
      },
      orderBy: [workshifts.createdAt],
      limit: 1,
    });

    return {
      prevId: prevWorkshift?.id ?? null,
      nextId: nextWorkshift?.id ?? null,
    };
  }
}
