import { RequestWorker } from "@core/interfaces/request";
import { Inject, Injectable } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import { discountsToRestaurants } from "@postgress-db/schema/discounts";
import { and, exists, inArray, SQL } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { DiscountEntity } from "src/discounts/entities/discount.entity";

@Injectable()
export class DiscountsService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
  ) {}

  public async findMany(options: {
    worker?: RequestWorker;
  }): Promise<DiscountEntity[]> {
    const { worker } = options;

    const conditions: SQL<unknown>[] = [];

    // If worker is not system admin, check if they have access to the discounts
    if (
      worker &&
      worker.role !== "SYSTEM_ADMIN" &&
      worker.role !== "CHIEF_ADMIN"
    ) {
      const restaurantIds =
        worker.role === "OWNER"
          ? worker.ownedRestaurants.map((r) => r.id)
          : worker.workersToRestaurants.map((r) => r.restaurantId);

      conditions.push(
        exists(
          this.pg
            .select({ id: discountsToRestaurants.restaurantId })
            .from(discountsToRestaurants)
            .where(inArray(discountsToRestaurants.restaurantId, restaurantIds)),
        ),
      );
    }

    const fetchedDiscounts = await this.pg.query.discounts.findMany({
      ...(conditions.length > 0 ? { where: () => and(...conditions) } : {}),
      with: {
        discountsToRestaurants: {
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

    return fetchedDiscounts.map(({ discountsToRestaurants, ...discount }) => ({
      ...discount,
      restaurants: discountsToRestaurants.map(({ restaurant }) => ({
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
      })),
    }));
  }
}
