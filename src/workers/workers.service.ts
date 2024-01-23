import { Inject, Injectable } from "@nestjs/common";
import { PG_CONNECTION } from "src/constants";
import * as schema from "@postgress-db/schema";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { WorkerEntity } from "./entities/worker.entity";

@Injectable()
export class WorkersService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
  ) {}

  async create() {}

  async findAll() {}

  async findById(id: number): Promise<schema.IWorker> {
    return await this.pg.query.workers.findFirst({
      where: eq(schema.workers.id, id),
    });
  }

  /**
   * Find one worker by login
   * @param value string login
   * @returns
   */
  async findOneByLogin(value: string): Promise<WorkerEntity> {
    return await this.pg.query.workers.findFirst({
      where: eq(schema.workers.login, value),
    });
  }

  async update() {}

  async remove() {}
}
