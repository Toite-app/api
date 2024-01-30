import { Inject, Injectable } from "@nestjs/common";
import { PG_CONNECTION } from "src/constants";
import * as schema from "@postgress-db/schema";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { count, eq } from "drizzle-orm";
import { WorkerEntity } from "./entities/worker.entity";
import { IPagination } from "@core/decorators/pagination.decorator";
import { CreateWorkerDto, UpdateWorkerDto } from "./dto/req/put-worker.dto";
import * as argon2 from "argon2";
import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";

@Injectable()
export class WorkersService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
  ) {}

  public async getTotalCount(): Promise<number> {
    return await this.pg
      .select({ value: count() })
      .from(schema.workers)
      .then((res) => res[0].value);
  }

  public async findMany(options: {
    pagination: IPagination;
  }): Promise<WorkerEntity[]> {
    return await this.pg.query.workers.findMany({
      limit: options.pagination.size,
      offset: options.pagination.offset,
    });
  }

  /**
   * Find one worker by id
   * @param id number id of worker
   * @returns
   */
  public async findById(id: number): Promise<schema.IWorker> {
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
  async create(dto: CreateWorkerDto): Promise<WorkerEntity> {
    const { password, role, ...rest } = dto;

    const worker = await this.pg.insert(schema.workers).values({
      ...rest,
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
  async update(id: number, dto: UpdateWorkerDto): Promise<WorkerEntity> {
    const { password, ...payload } = dto;

    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        "You should provide at least one field to update",
      );
    }

    await this.pg
      .update(schema.workers)
      .set({
        ...payload,
        ...(password
          ? {
              passwordHash: await argon2.hash(password),
            }
          : {}),
      })
      .where(eq(schema.workers.id, id));

    return await this.findById(id);
  }

  async remove() {}
}
