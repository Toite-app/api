import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import { and, eq, inArray } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";

import { UpdateDishPricelistDto } from "./dto/update-dish-pricelist.dto";
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
        dishesToRestaurants: {
          where: eq(schema.dishesToRestaurants.dishId, dishId),
        },
      },
    });

    // Transform the data into the required format
    return restaurants.map((restaurant): IDishPricelistItem => {
      const dishToRestaurant = restaurant.dishesToRestaurants[0];

      return {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        workshops: restaurant.workshops.map((workshop) => {
          const dishWorkshop = workshop.dishesToWorkshops[0];
          return {
            workshopId: workshop.id,
            workshopName: workshop.name,
            isActive: !!dishWorkshop,
            createdAt: dishWorkshop?.createdAt ?? null,
          };
        }),
        price: dishToRestaurant?.price ?? 0,
        currency: dishToRestaurant?.currency ?? "EUR",
        isInStoplist: dishToRestaurant?.isInStopList ?? false,
        createdAt: dishToRestaurant?.createdAt ?? null,
        updatedAt: dishToRestaurant?.updatedAt ?? null,
      };
    });
  }

  async updatePricelist(
    dishId: string,
    restaurantId: string,
    dto: UpdateDishPricelistDto,
  ): Promise<IDishPricelistItem> {
    // First verify that all workshopIds belong to the restaurant
    const workshops = await this.pg.query.restaurantWorkshops.findMany({
      where: eq(schema.restaurantWorkshops.restaurantId, restaurantId),
    });

    const validWorkshopIds = new Set(workshops.map((w) => w.id));
    const invalidWorkshopIds = dto.workshopIds.filter(
      (id) => !validWorkshopIds.has(id),
    );

    if (invalidWorkshopIds.length > 0) {
      throw new BadRequestException(
        `Workshop IDs ${invalidWorkshopIds.join(", ")} do not belong to restaurant ${restaurantId}`,
      );
    }

    // Update or create dish-restaurant relation
    await this.pg
      .insert(schema.dishesToRestaurants)
      .values({
        dishId,
        restaurantId,
        price: dto.price,
        currency: dto.currency,
        isInStopList: dto.isInStoplist,
      })
      .onConflictDoUpdate({
        target: [
          schema.dishesToRestaurants.dishId,
          schema.dishesToRestaurants.restaurantId,
        ],
        set: {
          price: dto.price,
          currency: dto.currency,
          isInStopList: dto.isInStoplist,
          updatedAt: new Date(),
        },
      });

    // Delete all existing workshop relations for this dish in this restaurant
    await this.pg.delete(schema.dishesToWorkshops).where(
      and(
        eq(schema.dishesToWorkshops.dishId, dishId),
        inArray(
          schema.dishesToWorkshops.workshopId,
          workshops.map((w) => w.id),
        ),
      ),
    );

    // Create new workshop relations
    if (dto.workshopIds.length > 0) {
      await this.pg.insert(schema.dishesToWorkshops).values(
        dto.workshopIds.map((workshopId) => ({
          dishId,
          workshopId,
        })),
      );
    }

    // Return updated pricelist item
    const [updatedItem] = await this.getPricelist(dishId);
    return updatedItem;
  }
}
