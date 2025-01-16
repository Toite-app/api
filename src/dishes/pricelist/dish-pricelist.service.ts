import { Inject, Injectable } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";

import { IDishPricelistItem } from "./entities/dish-pricelist-item.entity";

@Injectable()
export class DishPricelistService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
  ) {}

  async getPricelist(dishId: string): Promise<IDishPricelistItem[]> {
    // Get all restaurants with their workshops and dish relationships
    const restaurants = await this.pg.query.restaurants.findMany({
      with: {
        workshops: {
          with: {
            dishesToWorkshops: {
              where: eq(schema.dishesToWorkshops.dishId, dishId),
            },
          },
        },
      },
    });

    // Transform the data into the required format
    return restaurants.map((restaurant): IDishPricelistItem => {
      // Find first dish-workshop relationship to get price info
      const firstDishWorkshop = restaurant.workshops
        .flatMap((w) => w.dishesToWorkshops)
        .find((dw) => dw);

      return {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        workshops: restaurant.workshops.map((workshop) => {
          const dishWorkshop = workshop.dishesToWorkshops[0];
          return {
            workshopId: workshop.id,
            workshopName: workshop.name,
            isActive: dishWorkshop?.isActive ?? false,
            createdAt: dishWorkshop?.createdAt ?? null,
            updatedAt: dishWorkshop?.updatedAt ?? null,
          };
        }),
        price: firstDishWorkshop?.price ?? 0,
        currency: firstDishWorkshop?.currency ?? "EUR",
        isInStoplist: firstDishWorkshop?.isInStoplist ?? false,
      };
    });
  }
}
