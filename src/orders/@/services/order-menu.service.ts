import { ICursor } from "@core/decorators/cursor.decorator";
import { PAGINATION_DEFAULT_LIMIT } from "@core/decorators/pagination.decorator";
import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { NotFoundException } from "@core/errors/exceptions/not-found.exception";
import { Inject, Injectable } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import { dishCategories } from "@postgress-db/schema/dish-categories";
import {
  dishes,
  dishesToDishCategories,
  dishesToRestaurants,
} from "@postgress-db/schema/dishes";
import { asc, SQL } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { DishCategoryEntity } from "src/dish-categories/entities/dish-category.entity";
import {
  OrderMenuDishEntity,
  OrderMenuDishOrderDishEntity,
} from "src/orders/@/entities/order-menu-dish.entity";

@Injectable()
export class OrderMenuService {
  constructor(
    @Inject(PG_CONNECTION)
    private readonly pg: NodePgDatabase<typeof schema>,
  ) {}

  public async findDishCategories(
    orderId: string,
  ): Promise<DishCategoryEntity[]> {
    const order = await this.pg.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, orderId),
      columns: {},
      with: {
        restaurant: {
          columns: {},
          with: {
            dishesMenusToRestaurants: {
              columns: {
                dishesMenuId: true,
              },
            },
          },
        },
      },
    });
    const menuIds = (order?.restaurant?.dishesMenusToRestaurants || []).map(
      ({ dishesMenuId }) => dishesMenuId,
    );

    if (menuIds.length === 0) {
      return [];
    }

    const fetchedCategories = await this.pg.query.dishCategories.findMany({
      where: (dishCategories, { and, eq, inArray }) => {
        return and(
          eq(dishCategories.showForWorkers, true),
          inArray(dishCategories.menuId, menuIds),
        );
      },
      orderBy: [asc(dishCategories.sortIndex)],
    });

    return fetchedCategories;
  }

  public async getDishes(
    orderId: string,
    opts?: {
      cursor: ICursor;
      search?: string;
      dishCategoryId?: string;
    },
  ): Promise<OrderMenuDishEntity[]> {
    const { cursor, search, dishCategoryId } = opts ?? {};

    const order = await this.pg.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, orderId),
      columns: {
        id: true,
        restaurantId: true,
      },
      with: {
        orderDishes: {
          // Fetch pending dishes
          where: (orderDishes, { and, eq }) =>
            and(
              eq(orderDishes.status, "pending"),
              eq(orderDishes.isRemoved, false),
            ),
          columns: {
            id: true,
            dishId: true,
            price: true,
            quantity: true,
            discountPercent: true,
            surchargePercent: true,
            finalPrice: true,
          },
          with: {
            dishModifiersToOrderDishes: {
              with: {
                dishModifier: {
                  columns: {
                    name: true,
                  },
                },
              },
              columns: {
                dishModifierId: true,
              },
            },
          },
        },
        restaurant: {
          columns: {
            id: true,
          },
          with: {
            dishesMenusToRestaurants: {
              columns: {
                dishesMenuId: true,
              },
            },
          },
        },
      },
    });

    const menuIds = (
      order?.restaurant?.dishesMenusToRestaurants as { dishesMenuId: string }[]
    )
      .map((d) => d.dishesMenuId)
      .filter(Boolean);

    if (!order) {
      throw new NotFoundException();
    }

    if (!order.restaurantId) {
      throw new BadRequestException(
        "errors.order-menu.order-doesnt-have-restaurant",
      );
    }

    const fetchedDishes = await this.pg.query.dishes.findMany({
      where: (dishes, { and, eq, exists, inArray, ilike }) => {
        const conditions: SQL[] = [
          // From the menu that is assigned to the order restaurant
          inArray(dishes.menuId, menuIds),
          // Select only dishes that was assigned to the order restaurant
          exists(
            this.pg
              .select({
                id: dishesToRestaurants.dishId,
              })
              .from(dishesToRestaurants)
              .where(
                and(
                  eq(
                    dishesToRestaurants.restaurantId,
                    String(order.restaurantId),
                  ),
                  eq(dishesToRestaurants.dishId, dishes.id),
                ),
              ),
          ),
        ];

        if (search && search !== "null") {
          conditions.push(ilike(dishes.name, `%${search}%`));
        }

        if (dishCategoryId) {
          conditions.push(
            exists(
              this.pg
                .select()
                .from(dishesToDishCategories)
                .where(
                  and(
                    eq(dishesToDishCategories.dishId, dishes.id),
                    eq(dishesToDishCategories.dishCategoryId, dishCategoryId),
                  ),
                ),
            ),
          );
        }

        return and(...conditions);
      },
      columns: {
        id: true,
        name: true,
        cookingTimeInMin: true,
        amountPerItem: true,
      },
      with: {
        dishesToRestaurants: {
          where: (dishesToRestaurants, { and, eq }) =>
            and(
              eq(dishesToRestaurants.restaurantId, String(order.restaurantId)),
            ),
          // Load stop list status
          columns: {
            dishId: true,
            isInStopList: true,
            currency: true,
          },
        },
        dishesToImages: {
          with: {
            imageFile: true,
          },
        },
      },
      orderBy: [asc(dishes.id)],
      limit: cursor?.limit ?? PAGINATION_DEFAULT_LIMIT,
    });

    const dishIdToOrderDishMap = new Map(
      order.orderDishes.map((d) => [d.dishId, d]),
    );

    return fetchedDishes.map(
      ({ dishesToRestaurants, dishesToImages, ...dish }) => {
        const { currency, isInStopList } = dishesToRestaurants[0] ?? {};

        let orderDish: OrderMenuDishOrderDishEntity | null = null;

        if (dishIdToOrderDishMap.has(dish.id)) {
          const { ...rest } = dishIdToOrderDishMap.get(dish.id);

          const dishModifiersToOrderDishes = (rest as any)
            .dishModifiersToOrderDishes as unknown as {
            dishModifierId: string;
            dishModifier: { name: string };
          }[];

          orderDish = {
            ...rest,
            // @ts-expect-error - TODO: fix this
            dishModifiersToOrderDishes: undefined,
            currency,
            modifiers: (
              dishModifiersToOrderDishes as unknown as {
                dishModifierId: string;
                dishModifier: { name: string };
              }[]
            ).map(({ dishModifierId, dishModifier }) => ({
              id: dishModifierId,
              name: dishModifier.name,
            })),
          };
        }

        return {
          ...dish,
          orderDish,
          images: dishesToImages
            .sort((a, b) => a.sortIndex - b.sortIndex)
            .map((di) => ({
              ...di.imageFile,
              alt: di.alt,
              sortIndex: di.sortIndex,
            })),
          isInStopList,
        };
      },
    );
  }
}
