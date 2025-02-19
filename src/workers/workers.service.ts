import { IFilters } from "@core/decorators/filter.decorator";
import { IPagination } from "@core/decorators/pagination.decorator";
import { ISorting } from "@core/decorators/sorting.decorator";
import env from "@core/env";
import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { ConflictException } from "@core/errors/exceptions/conflict.exception";
import { ServerErrorException } from "@core/errors/exceptions/server-error.exception";
import { Inject, Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import { IWorker } from "@postgress-db/schema/workers";
import * as argon2 from "argon2";
import { and, count, eq, sql } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DrizzleUtils } from "src/@base/drizzle/drizzle-utils";
import { PG_CONNECTION } from "src/constants";

import { CreateWorkerDto, UpdateWorkerDto } from "./dto/req/put-worker.dto";
import { WorkerEntity } from "./entities/worker.entity";

@Injectable()
export class WorkersService implements OnApplicationBootstrap {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
  ) {}

  async onApplicationBootstrap() {
    await this.createInitialAdminIfNeeded();
  }

  private checkRestaurantRoleAssignment(role?: IWorker["role"]) {
    if (role === "SYSTEM_ADMIN" || role === "CHIEF_ADMIN") {
      throw new BadRequestException(
        "errors.workers.role.cant-assign-restaurant-to-this-role",
        {
          property: "role",
        },
      );
    }

    return true;
  }

  public async getTotalCount(filters?: IFilters): Promise<number> {
    const query = this.pg.select({ value: count() }).from(schema.workers);

    if (filters) {
      query.where(DrizzleUtils.buildFilterConditions(schema.workers, filters));
    }

    return await query.then((res) => res[0].value);
  }

  public async findMany(options: {
    pagination: IPagination;
    sorting: ISorting;
    filters?: IFilters;
  }): Promise<WorkerEntity[]> {
    const { pagination, sorting, filters } = options;

    const workers = await this.pg.query.workers.findMany({
      ...(filters
        ? {
            where: () =>
              and(DrizzleUtils.buildFilterConditions(schema.workers, filters)),
          }
        : {}),
      with: {
        workersToRestaurants: {
          with: {
            restaurant: {
              columns: {
                name: true,
              },
            },
          },
          columns: {
            restaurantId: true,
          },
        },
      },
      ...(sorting
        ? {
            orderBy: (workers, { asc, desc }) => [
              sorting.sortOrder === "asc"
                ? asc(sql.identifier(sorting.sortBy))
                : desc(sql.identifier(sorting.sortBy)),
            ],
          }
        : {}),
      limit: pagination.size,
      offset: pagination.offset,
    });

    return workers.map((w) => ({
      ...w,
      restaurants: w.workersToRestaurants.map((r) => ({
        restaurantId: r.restaurantId,
        restaurantName: r.restaurant.name,
      })),
    }));
  }

  /**
   * Find one worker by id
   * @param id number id of worker
   * @returns
   */
  public async findById(id: string): Promise<WorkerEntity | undefined> {
    const worker = await this.pg.query.workers.findFirst({
      where: (workers, { eq }) => eq(workers.id, id),
      with: {
        workersToRestaurants: {
          with: {
            restaurant: {
              columns: {
                name: true,
              },
            },
          },
          columns: {
            restaurantId: true,
          },
        },
      },
    });

    if (!worker) return undefined;

    return {
      ...worker,
      restaurants: worker.workersToRestaurants.map((r) => ({
        restaurantId: r.restaurantId,
        restaurantName: r.restaurant.name,
      })),
    };
  }

  /**
   * Find one worker by login
   * @param value string login
   * @returns
   */
  public async findOneByLogin(
    value: string,
  ): Promise<WorkerEntity | undefined> {
    const worker = await this.pg.query.workers.findFirst({
      where: (workers, { eq }) => eq(workers.login, value),
      columns: {
        id: true,
      },
    });

    if (!worker?.id) return undefined;

    return await this.findById(worker?.id);
  }

  /**
   * Create a new worker
   * @param dto
   * @returns
   */
  public async create(dto: CreateWorkerDto): Promise<WorkerEntity | undefined> {
    const { password, role, restaurants, ...rest } = dto;

    if (restaurants?.length) {
      this.checkRestaurantRoleAssignment(role);
    }

    const workers = await this.pg.transaction(async (tx) => {
      const [worker] = await tx
        .insert(schema.workers)
        .values({
          ...rest,
          role,
          passwordHash: await argon2.hash(password),
        })
        .returning();

      if (restaurants?.length) {
        await tx.insert(schema.workersToRestaurants).values(
          restaurants.map((r) => ({
            workerId: worker.id,
            restaurantId: r.restaurantId,
          })),
        );
      }

      return [worker];
    });

    const worker = workers[0];

    if (!worker || !worker.login) {
      throw new ServerErrorException("errors.workers.failed-to-create-worker");
    }

    return await this.findOneByLogin(worker.login);
  }

  /**
   * Update worker by id
   * @param id Id of the worker
   * @param dto
   * @returns
   */
  public async update(
    id: string,
    dto: UpdateWorkerDto,
  ): Promise<WorkerEntity | undefined> {
    const { password, role, login, restaurants, ...payload } = dto;

    if (login) {
      const exist = await this.findOneByLogin(login);

      if (
        exist &&
        exist.id !== id &&
        exist.login.toLowerCase() === login.toLowerCase()
      ) {
        throw new ConflictException(
          "errors.workers.worker-with-this-login-already-exists",
          {
            property: "login",
          },
        );
      }
    }

    if (restaurants?.length) {
      this.checkRestaurantRoleAssignment(role);
    }

    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        "errors.common.atleast-one-field-should-be-provided",
      );
    }

    await this.pg.transaction(async (tx) => {
      await tx
        .update(schema.workers)
        .set({
          ...payload,
          login,
          role,
          ...(password
            ? {
                passwordHash: await argon2.hash(password),
              }
            : {}),
        })
        .where(eq(schema.workers.id, id));

      if (restaurants) {
        await tx
          .delete(schema.workersToRestaurants)
          .where(eq(schema.workersToRestaurants.workerId, id));

        if (restaurants.length > 0) {
          await tx.insert(schema.workersToRestaurants).values(
            restaurants.map((r) => ({
              workerId: id,
              restaurantId: r.restaurantId,
            })),
          );
        }
      }
    });

    return await this.findById(id);
  }

  public async remove() {}

  /**
   * Creates initial admin user if no workers exist in the database
   */
  public async createInitialAdminIfNeeded(): Promise<void> {
    if ((await this.getTotalCount()) === 0) {
      await this.create({
        login: "admin",
        name: "Admin",
        password: env.INITIAL_ADMIN_PASSWORD ?? "123456",
        role: schema.ZodWorkerRole.Enum.SYSTEM_ADMIN,
        onlineAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
}
