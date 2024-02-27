import { Inject, Injectable } from "@nestjs/common";
import { PG_CONNECTION } from "src/constants";
import * as schema from "@postgress-db/schema";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { asc, count, desc, eq, sql } from "drizzle-orm";
import { WorkerEntity } from "./entities/worker.entity";
import { IPagination } from "@core/decorators/pagination.decorator";
import { CreateWorkerDto, UpdateWorkerDto } from "./dto/req/put-worker.dto";
import * as argon2 from "argon2";
import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { ConflictException } from "@core/errors/exceptions/conflict.exception";
import { ISorting } from "@core/decorators/sorting.decorator";

@Injectable()
export class WorkersService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
  ) {}

  private checkRestaurantRoleAssignment(role?: schema.IWorker["role"]) {
    if (role === "SYSTEM_ADMIN" || role === "CHIEF_ADMIN") {
      throw new BadRequestException("You can't assign restaurant to this role");
    }

    return true;
  }

  public async getTotalCount(): Promise<number> {
    return await this.pg
      .select({ value: count() })
      .from(schema.workers)
      .then((res) => res[0].value);
  }

  public async findMany(options: {
    pagination?: IPagination;
    sorting?: ISorting;
  }): Promise<WorkerEntity[]> {
    const { pagination, sorting } = options;

    return await this.pg.query.workers.findMany({
      // Sorting
      ...(sorting
        ? {
            orderBy:
              sorting.sortOrder === "asc"
                ? asc(sql.identifier(sorting.sortBy))
                : desc(sql.identifier(sorting.sortBy)),
          }
        : {}),
      // Pagination
      ...(pagination
        ? {
            limit: pagination.size,
            offset: pagination.offset,
          }
        : {}),
    });
  }

  /**
   * Find one worker by id
   * @param id number id of worker
   * @returns
   */
  public async findById(id: string): Promise<schema.IWorker> {
    return await this.pg.query.workers.findFirst({
      where: eq(schema.workers.id, id),
    });
  }

  /**
   * Find one worker by login
   * @param value string login
   * @returns
   */
  public async findOneByLogin(value: string): Promise<WorkerEntity> {
    return await this.pg.query.workers.findFirst({
      where: eq(schema.workers.login, value),
    });
  }

  /**
   * Create a new worker
   * @param dto
   * @returns
   */
  public async create(dto: CreateWorkerDto): Promise<WorkerEntity> {
    const { password, role, restaurantId, ...rest } = dto;

    if (restaurantId) {
      this.checkRestaurantRoleAssignment(role);
    }

    const worker = await this.pg.insert(schema.workers).values({
      ...rest,
      restaurantId,
      role,
      passwordHash: await argon2.hash(password),
    });

    return await this.findOneByLogin(worker.login);
  }

  /**
   * Update worker by id
   * @param id Id of the worker
   * @param dto
   * @returns
   */
  public async update(id: string, dto: UpdateWorkerDto): Promise<WorkerEntity> {
    const { password, role, login, restaurantId, ...payload } = dto;

    const exist = await this.findOneByLogin(login);

    if (
      exist &&
      exist.id !== id &&
      exist.login.toLowerCase() === login.toLowerCase()
    ) {
      throw new ConflictException("Worker with this login already exists");
    }

    if (restaurantId) {
      this.checkRestaurantRoleAssignment(role);
    }

    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        "You should provide at least one field to update",
      );
    }

    await this.pg
      .update(schema.workers)
      .set({
        ...payload,
        login,
        role,
        updatedAt: new Date(),
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
}
