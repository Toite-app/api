import { Inject, Injectable } from "@nestjs/common";
import { PG_CONNECTION } from "src/constants";
import * as schema from "@postgress-db/schema";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { count, eq } from "drizzle-orm";
import { WorkerEntity } from "./entities/worker.entity";
import { IPagination } from "@core/decorators/pagination.decorator";

@Injectable()
export class WorkersService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
  ) {}

  async create() {}

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

  async update() {}

  async remove() {}
}
