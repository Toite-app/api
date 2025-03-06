import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Logger } from "@nestjs/common";
import { Schema } from "@postgress-db/drizzle.module";
import { dishesMenus } from "@postgress-db/schema/dishes-menus";
import { Job } from "bullmq";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { RedlockService } from "src/@base/redlock/redlock.service";
import { PG_CONNECTION } from "src/constants";
import { DISHES_MENUS_QUEUE, DishesMenusQueueJobName } from "src/dishes-menus";

@Processor(DISHES_MENUS_QUEUE, {})
export class DishesMenusProcessor extends WorkerHost {
  private readonly logger = new Logger(DishesMenusProcessor.name);

  constructor(
    @Inject(PG_CONNECTION)
    private readonly pg: NodePgDatabase<Schema>,
    private readonly redlockService: RedlockService,
  ) {
    super();
  }

  async process(job: Job) {
    const { name } = job;

    try {
      switch (name) {
        case DishesMenusQueueJobName.CREATE_OWNERS_DEFAULT_MENUS: {
          const lock = await this.redlockService.acquire(
            ["locks:create-owners-default-menus"],
            10_000,
          );

          try {
            await this.createOwnersDefaultMenus();
          } finally {
            await this.redlockService.release(lock);
          }
          break;
        }

        default: {
          throw new Error(`Unknown job name`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to process ${name} job`, error);

      throw error;
    }
  }

  private async createOwnersDefaultMenus() {
    const ownersWithoutMenus = await this.pg.query.workers.findMany({
      where: (workers, { and, eq, notExists }) =>
        and(
          eq(workers.role, "OWNER"),
          notExists(
            this.pg
              .select({
                id: dishesMenus.id,
              })
              .from(dishesMenus)
              .where(
                and(
                  eq(dishesMenus.ownerId, workers.id),
                  eq(dishesMenus.isRemoved, false),
                ),
              ),
          ),
        ),
      columns: {
        id: true,
      },
    });

    for (const owner of ownersWithoutMenus) {
      await this.pg.insert(dishesMenus).values({
        ownerId: owner.id,
        name: "Default",
        isRemoved: false,
      });
    }
  }
}
