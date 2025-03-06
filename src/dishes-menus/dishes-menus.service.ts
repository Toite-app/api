import { RequestWorker } from "@core/interfaces/request";
import { Inject, Injectable } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import { dishesMenus } from "@postgress-db/schema/dishes-menus";
import { and, eq, inArray, SQL } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { DishesMenuEntity } from "src/dishes-menus/entity/dishes-menu.entity";

@Injectable()
export class DishesMenusService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
  ) {}

  public async findMany(options: {
    worker: RequestWorker;
  }): Promise<DishesMenuEntity[]> {
    const { worker } = options;

    const conditions: SQL[] = [];

    if (worker.role === "SYSTEM_ADMIN" || worker.role === "CHIEF_ADMIN") {
      // Fetch all menus
    } else if (worker.role === "OWNER") {
      // Fetch all menus of the owner
      conditions.push(eq(dishesMenus.ownerId, worker.id));
    } else if (worker.role === "ADMIN") {
      // Fetch all menus of the restaurants of the admin
      conditions.push(
        inArray(
          dishesMenus.ownerId,
          worker.workersToRestaurants.map(({ restaurantId }) => restaurantId),
        ),
      );
    }

    const fetchedMenus = await this.pg.query.dishesMenus.findMany({
      ...(conditions.length > 0 && { where: and(...conditions) }),
      with: {
        dishesMenusToRestaurants: {
          columns: {},
          with: {
            restaurant: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return fetchedMenus.map(({ dishesMenusToRestaurants, ...dishesMenu }) => ({
      ...dishesMenu,
      restaurants: dishesMenusToRestaurants.map(({ restaurant }) => restaurant),
    }));
  }
}
