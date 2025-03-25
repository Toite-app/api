import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { Inject, Injectable } from "@nestjs/common";
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
    const dish = await this.pg.query.dishes.findFirst({
      where: (dishes, { eq }) => eq(dishes.id, dishId),
      columns: {
        menuId: true,
      },
      with: {
        menu: {
          columns: {},
          with: {
            dishesMenusToRestaurants: {
              columns: {
                restaurantId: true,
              },
            },
          },
        },
      },
    });

    const restaurantIds = (dish?.menu?.dishesMenusToRestaurants ?? []).map(
      (r) => r.restaurantId,
    );

    if (restaurantIds.length === 0) {
      return [];
    }

    // Get all restaurants with their workshops and dish relationships
    const restaurants = await this.pg.query.restaurants.findMany({
      where: (restaurants, { inArray }) =>
        inArray(restaurants.id, restaurantIds ?? []),
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
        price: parseFloat(dishToRestaurant?.price ?? "0"),
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
    const dish = await this.pg.query.dishes.findFirst({
      where: eq(schema.dishes.id, dishId),
      columns: {},
      with: {
        menu: {
          columns: {},
          with: {
            dishesMenusToRestaurants: {
              where: eq(
                schema.dishesMenusToRestaurants.restaurantId,
                restaurantId,
              ),
              columns: {
                restaurantId: true,
              },
              with: {
                restaurant: {
                  columns: {
                    currency: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (
      !dish ||
      !dish.menu ||
      dish.menu.dishesMenusToRestaurants.length === 0
    ) {
      throw new BadRequestException(
        "errors.dish-pricelist.provided-restaurant-dont-assigned-to-menu",
      );
    }

    if (
      dish.menu.dishesMenusToRestaurants.some(
        (r) => r.restaurant.currency !== dto.currency,
      )
    ) {
      throw new BadRequestException(
        "errors.dish-pricelist.provided-currency-dont-match-restaurant-currency",
        {
          property: "currency",
        },
      );
    }

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
        "errors.dish-pricelist.provided-workshop-ids-dont-belong-to-restaurant",
        {
          property: "workshopIds",
        },
      );
    }

    await this.pg.transaction(async (tx) => {
      // Update or create dish-restaurant relation
      await tx
        .insert(schema.dishesToRestaurants)
        .values({
          dishId,
          restaurantId,
          price: dto.price.toString(),
          currency: dto.currency,
          isInStopList: dto.isInStoplist,
        })
        .onConflictDoUpdate({
          target: [
            schema.dishesToRestaurants.dishId,
            schema.dishesToRestaurants.restaurantId,
          ],
          set: {
            price: dto.price.toString(),
            currency: dto.currency,
            isInStopList: dto.isInStoplist,
            updatedAt: new Date(),
          },
        });

      // Delete all existing workshop relations for this dish in this restaurant
      await tx.delete(schema.dishesToWorkshops).where(
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
        await tx.insert(schema.dishesToWorkshops).values(
          dto.workshopIds.map((workshopId) => ({
            dishId,
            workshopId,
          })),
        );
      }
    });

    // Return updated pricelist item
    const [updatedItem] = await this.getPricelist(dishId);

    return updatedItem;
  }
}
