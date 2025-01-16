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
import { asc, count, desc, eq, sql } from "drizzle-orm";
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

    const query = this.pg
      .select({
        id: schema.workers.id,
        name: schema.workers.name,
        login: schema.workers.login,
        role: schema.workers.role,
        isBlocked: schema.workers.isBlocked,
        hiredAt: schema.workers.hiredAt,
        firedAt: schema.workers.firedAt,
        onlineAt: schema.workers.onlineAt,
        createdAt: schema.workers.createdAt,
        updatedAt: schema.workers.updatedAt,
        restaurantId: schema.workers.restaurantId,
        restaurantName: schema.restaurants.name,
        passwordHash: schema.workers.passwordHash,
      })
      .from(schema.workers)
      .leftJoin(
        schema.restaurants,
        eq(schema.workers.restaurantId, schema.restaurants.id),
      );

    if (filters) {
      query.where(DrizzleUtils.buildFilterConditions(schema.workers, filters));
    }

    if (sorting) {
      query.orderBy(
        sorting.sortOrder === "asc"
          ? asc(sql.identifier(sorting.sortBy))
          : desc(sql.identifier(sorting.sortBy)),
      );
    }

    return await query.limit(pagination.size).offset(pagination.offset);
  }

  /**
   * Find one worker by id
   * @param id number id of worker
   * @returns
   */
  public async findById(id: string): Promise<WorkerEntity | undefined> {
    const result = await this.pg
      .select({
        id: schema.workers.id,
        name: schema.workers.name,
        login: schema.workers.login,
        role: schema.workers.role,
        isBlocked: schema.workers.isBlocked,
        hiredAt: schema.workers.hiredAt,
        firedAt: schema.workers.firedAt,
        onlineAt: schema.workers.onlineAt,
        createdAt: schema.workers.createdAt,
        updatedAt: schema.workers.updatedAt,
        restaurantId: schema.workers.restaurantId,
        restaurantName: schema.restaurants.name,
        passwordHash: schema.workers.passwordHash,
      })
      .from(schema.workers)
      .leftJoin(
        schema.restaurants,
        eq(schema.workers.restaurantId, schema.restaurants.id),
      )
      .where(eq(schema.workers.id, id))
      .limit(1);

    return result[0];
  }

  /**
   * Find one worker by login
   * @param value string login
   * @returns
   */
  public async findOneByLogin(
    value: string,
  ): Promise<WorkerEntity | undefined> {
    const result = await this.pg
      .select({
        id: schema.workers.id,
        name: schema.workers.name,
        login: schema.workers.login,
        role: schema.workers.role,
        isBlocked: schema.workers.isBlocked,
        hiredAt: schema.workers.hiredAt,
        firedAt: schema.workers.firedAt,
        onlineAt: schema.workers.onlineAt,
        createdAt: schema.workers.createdAt,
        updatedAt: schema.workers.updatedAt,
        restaurantId: schema.workers.restaurantId,
        restaurantName: schema.restaurants.name,
        passwordHash: schema.workers.passwordHash,
      })
      .from(schema.workers)
      .leftJoin(
        schema.restaurants,
        eq(schema.workers.restaurantId, schema.restaurants.id),
      )
      .where(eq(schema.workers.login, value))
      .limit(1);

    return result[0];
  }

  /**
   * Create a new worker
   * @param dto
   * @returns
   */
  public async create(dto: CreateWorkerDto): Promise<WorkerEntity | undefined> {
    const { password, role, restaurantId, ...rest } = dto;

    if (restaurantId) {
      this.checkRestaurantRoleAssignment(role);
    }

    const workers = await this.pg
      .insert(schema.workers)
      .values({
        ...rest,
        // restaurantId,
        role,
        passwordHash: await argon2.hash(password),
      })
      .returning();

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
    const { password, role, login, restaurantId, ...payload } = dto;

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

    if (restaurantId) {
      this.checkRestaurantRoleAssignment(role);
    }

    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        "errors.common.atleast-one-field-should-be-provided",
      );
    }

    await this.pg
      .update(schema.workers)
      .set({
        ...payload,
        login,
        role,
        ...(role === "SYSTEM_ADMIN" || role === "CHIEF_ADMIN"
          ? { restaurantId: null }
          : { restaurantId }),
        ...(password
          ? {
              passwordHash: await argon2.hash(password),
            }
          : {}),
      })
      .where(eq(schema.workers.id, id));

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
