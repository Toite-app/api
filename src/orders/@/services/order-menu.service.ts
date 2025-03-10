import { ICursor } from "@core/decorators/cursor.decorator";
import { PAGINATION_DEFAULT_LIMIT } from "@core/decorators/pagination.decorator";
import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { NotFoundException } from "@core/errors/exceptions/not-found.exception";
import { Inject, Injectable } from "@nestjs/common";
import { dishes, dishesToRestaurants } from "@postgress-db/schema/dishes";
import { asc } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import {
  OrderMenuDishEntity,
  OrderMenuDishOrderDishEntity,
} from "src/orders/@/entities/order-menu-dish.entity";
import { schema } from "test/helpers/database";

@Injectable()
export class OrderMenuService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
  ) {}

  public async getDishes(
    orderId: string,
    opts?: {
      cursor: ICursor;
    },
  ): Promise<OrderMenuDishEntity[]> {
    const { cursor } = opts ?? {};

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
      where: (dishes, { and, eq, exists, inArray }) =>
        and(
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
        ),
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
