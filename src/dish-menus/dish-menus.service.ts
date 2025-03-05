import { RequestWorker } from "@core/interfaces/request";
import { Inject, Injectable } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import { dishesMenu } from "@postgress-db/schema/dishes-menu";
import { and, eq, SQL } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";

@Injectable()
export class DishMenusService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
  ) {}

  public async findMany(options: { worker: RequestWorker }) {
    const { worker } = options;

    const conditions: SQL[] = [];

    if (worker.role === "OWNER") {
      conditions.push(eq(dishesMenu.ownerId, worker.id));
    }

    return await this.pg.query.dishesMenu.findMany({
      ...(conditions.length > 0 && { where: and(...conditions) }),
    });
  }
}
