import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { RequestWorker } from "@core/interfaces/request";
import { Inject, Injectable } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import {
  discounts,
  discountsConnections,
} from "@postgress-db/schema/discounts";
import { and, eq, exists, inArray, SQL } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { CreateDiscountDto } from "src/discounts/dto/create-discount.dto";
import { UpdateDiscountDto } from "src/discounts/dto/update-discount.dto";
import {
  DiscountConnectionEntity,
  DiscountEntity,
  DiscountFullEntity,
} from "src/discounts/entities/discount.entity";

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
            .select({ id: discountsConnections.restaurantId })
            .from(discountsConnections)
            .where(inArray(discountsConnections.restaurantId, restaurantIds)),
        ),
      );
    }

    const fetchedDiscounts = await this.pg.query.discounts.findMany({
      ...(conditions.length > 0 ? { where: () => and(...conditions) } : {}),
      orderBy: (discounts, { desc }) => [desc(discounts.createdAt)],
    });

    return fetchedDiscounts.map(({ ...discount }) => ({
      ...discount,
    }));
  }

  public async findOne(
    id: string,
    options: { worker?: RequestWorker },
  ): Promise<DiscountFullEntity | null> {
    const { worker } = options;

    worker;

    const discount = await this.pg.query.discounts.findFirst({
      where: eq(discounts.id, id),
      with: {
        connections: {
          with: {
            dishesMenu: {
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
                owner: {
                  columns: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!discount) {
      return null;
    }

    // Group connections by dishesMenuId
    const groupedConnections = discount.connections.reduce(
      (acc, connection) => {
        const key = connection.dishesMenuId;
        if (!acc[key]) {
          acc[key] = {
            dishesMenuId: connection.dishesMenuId,
            dishesMenu: {
              ...connection.dishesMenu,
              restaurants: connection.dishesMenu.dishesMenusToRestaurants.map(
                ({ restaurant }) => restaurant,
              ),
            },
            restaurantIds: [],
            dishCategoryIds: [],
          };
        }
        acc[key].restaurantIds.push(connection.restaurantId);
        acc[key].dishCategoryIds.push(connection.dishCategoryId);
        return acc;
      },
      {} as Record<string, DiscountConnectionEntity>,
    );

    return {
      ...discount,
      connections: Object.values(groupedConnections).map((connection) => ({
        ...connection,
        restaurantIds: [...new Set(connection.restaurantIds)],
        dishCategoryIds: [...new Set(connection.dishCategoryIds)],
      })),
    };
  }

  private async validatePayload(
    payload: CreateDiscountDto | UpdateDiscountDto,
    worker: RequestWorker,
  ) {
    if (!payload.menus || payload.menus.length === 0) {
      throw new BadRequestException(
        "errors.discounts.you-should-provide-at-least-one-menu",
      );
    }

    // If worker is owner, check if they own all provided restaurant ids
    if (worker.role === "SYSTEM_ADMIN" || worker.role === "CHIEF_ADMIN") {
    } else if (worker.role === "OWNER" || worker.role === "ADMIN") {
      const restaurantIdsSet = new Set(
        worker.role === "OWNER"
          ? worker.ownedRestaurants.map((r) => r.id)
          : worker.workersToRestaurants.map((r) => r.restaurantId),
      );

      const menusRestaurantIds = payload.menus.flatMap(
        (menu) => menu.restaurantIds,
      );

      if (menusRestaurantIds.some((id) => !restaurantIdsSet.has(id))) {
        throw new BadRequestException(
          "errors.discounts.you-provided-restaurant-id-that-you-dont-own",
        );
      }
    }
  }

  public async create(
    payload: CreateDiscountDto,
    options: { worker: RequestWorker },
  ) {
    const { worker } = options;

    await this.validatePayload(payload, worker);

    const discount = await this.pg.transaction(async (tx) => {
      const [discount] = await tx
        .insert(discounts)
        .values({
          ...payload,
          activeFrom: new Date(payload.activeFrom),
          activeTo: new Date(payload.activeTo),
        })
        .returning({
          id: discounts.id,
        });

      const connections = payload.menus.flatMap(
        ({ dishesMenuId, categoryIds, restaurantIds }) => {
          return restaurantIds.flatMap((restaurantId) =>
            categoryIds.map(
              (categoryId) =>
                ({
                  discountId: discount.id,
                  dishesMenuId,
                  restaurantId,
                  dishCategoryId: categoryId,
                }) as typeof discountsConnections.$inferInsert,
            ),
          );
        },
      );

      // Insert connections
      await tx
        .insert(discountsConnections)
        .values(connections)
        .onConflictDoNothing();

      return discount;
    });

    return await this.findOne(discount.id, { worker });
  }

  public async update(
    id: string,
    payload: UpdateDiscountDto,
    options: { worker: RequestWorker },
  ) {
    const { worker } = options;

    const existingDiscount = await this.findOne(id, { worker });
    if (!existingDiscount) {
      throw new BadRequestException(
        "errors.discounts.discount-with-provided-id-not-found",
      );
    }

    if (payload.menus) {
      await this.validatePayload(payload, worker);
    }

    const updatedDiscount = await this.pg.transaction(async (tx) => {
      // Update discount
      const [discount] = await tx
        .update(discounts)
        .set({
          ...payload,
          ...(payload.activeFrom
            ? { activeFrom: new Date(payload.activeFrom) }
            : {}),
          ...(payload.activeTo ? { activeTo: new Date(payload.activeTo) } : {}),
          updatedAt: new Date(),
        })
        .where(eq(discounts.id, id))
        .returning({
          id: discounts.id,
        });

      if (payload.menus) {
        const connections = payload.menus.flatMap(
          ({ dishesMenuId, categoryIds, restaurantIds }) => {
            return restaurantIds.flatMap((restaurantId) =>
              categoryIds.map(
                (categoryId) =>
                  ({
                    discountId: discount.id,
                    dishesMenuId,
                    restaurantId,
                    dishCategoryId: categoryId,
                  }) as typeof discountsConnections.$inferInsert,
              ),
            );
          },
        );

        // Insert connections
        await tx
          .insert(discountsConnections)
          .values(connections)
          .onConflictDoNothing();
      }

      return discount;
    });

    return await this.findOne(updatedDiscount.id, { worker });
  }
}
