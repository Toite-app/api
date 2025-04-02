import { IFilters } from "@core/decorators/filter.decorator";
import {
  IPagination,
  PAGINATION_DEFAULT_LIMIT,
} from "@core/decorators/pagination.decorator";
import { ISorting } from "@core/decorators/sorting.decorator";
import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { NotFoundException } from "@core/errors/exceptions/not-found.exception";
import { ServerErrorException } from "@core/errors/exceptions/server-error.exception";
import { RequestWorker } from "@core/interfaces/request";
import { Inject, Injectable } from "@nestjs/common";
import { DrizzleUtils } from "@postgress-db/drizzle-utils";
import { schema } from "@postgress-db/drizzle.module";
import { and, asc, count, desc, eq, sql, SQL } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";

import { CreateDishDto } from "./dtos/create-dish.dto";
import { UpdateDishDto } from "./dtos/update-dish.dto";
import { DishEntity } from "./entities/dish.entity";

@Injectable()
export class DishesService {
  constructor(
    // Inject postgres connection
    @Inject(PG_CONNECTION)
    private readonly pg: NodePgDatabase<typeof schema>,
  ) {}

  public async getTotalCount({
    filters,
  }: {
    filters?: IFilters;
  }): Promise<number> {
    const conditions: SQL[] = [];

    const query = this.pg
      .select({
        value: count(),
      })
      .from(schema.dishes);

    if (filters) {
      conditions.push(
        DrizzleUtils.buildFilterConditions(schema.dishes, filters) as SQL,
      );
    }

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    return await query.then((res) => res[0].value);
  }

  public async findMany(options?: {
    pagination?: IPagination;
    sorting?: ISorting;
    filters?: IFilters;
  }): Promise<DishEntity[]> {
    const { pagination, sorting, filters } = options ?? {};

    const where = filters
      ? DrizzleUtils.buildFilterConditions(schema.dishes, filters)
      : undefined;

    const orderBy = sorting
      ? [
          sorting.sortOrder === "asc"
            ? asc(sql.identifier(sorting.sortBy))
            : desc(sql.identifier(sorting.sortBy)),
        ]
      : undefined;

    const result = await this.pg.query.dishes.findMany({
      where,
      with: {
        dishesToDishCategories: {
          columns: {},
          with: {
            dishCategory: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        },
        dishesToImages: {
          with: {
            imageFile: true,
          },
        },
      },
      orderBy,
      limit: pagination?.size ?? PAGINATION_DEFAULT_LIMIT,
      offset: pagination?.offset ?? 0,
    });

    return result.map((dish) => ({
      ...dish,
      categories: dish.dishesToDishCategories.map((dc) => dc.dishCategory),
      images: dish.dishesToImages
        .sort((a, b) => a.sortIndex - b.sortIndex)
        .map((di) => ({
          ...di.imageFile,
          alt: di.alt,
          sortIndex: di.sortIndex,
        })),
    }));
  }

  private async validateMenuId(menuId: string, worker: RequestWorker) {
    // SYSTEM_ADMIN, CHIEF_ADMIN can create dishes for any menu
    if (worker.role === "SYSTEM_ADMIN" || worker.role === "CHIEF_ADMIN") {
      return true;
    }

    const menu = await this.pg.query.dishesMenus.findFirst({
      where: eq(schema.dishesMenus.id, menuId),
      columns: {
        ownerId: true,
      },
      with: {
        dishesMenusToRestaurants: {
          columns: {
            restaurantId: true,
          },
        },
      },
    });

    if (!menu) {
      throw new NotFoundException();
    }

    // If menu doesn't have assigned restaurants, throw error
    if (menu.dishesMenusToRestaurants.length === 0) {
      throw new BadRequestException(
        "errors.dishes.provided-menu-doesnt-have-assigned-restaurants",
        {
          property: "menuId",
        },
      );
    }

    // If worker is owner and menu is not owned by him, throw error
    if (worker.role === "OWNER" && menu.ownerId !== worker.id) {
      throw new BadRequestException(
        "errors.dishes.you-dont-have-rights-to-the-provided-menu",
        {
          property: "menuId",
        },
      );
    }

    // ADMIN can create dishes for any restaurant that is assigned to him
    if (worker.role === "ADMIN") {
      const adminRestaurantIdsSet = new Set(
        worker.workersToRestaurants.map((wr) => wr.restaurantId),
      );

      if (
        !menu.dishesMenusToRestaurants.some((m) =>
          adminRestaurantIdsSet.has(m.restaurantId),
        )
      ) {
        throw new BadRequestException(
          "errors.dishes.you-dont-have-rights-to-the-provided-menu",
          {
            property: "menuId",
          },
        );
      }
    }

    return true;
  }

  private async validateCategoryIds(menuId: string, categoryIds: string[]) {
    const categories = await this.pg.query.dishCategories.findMany({
      where: (dishCategories, { and, inArray }) =>
        and(
          eq(dishCategories.menuId, menuId),
          inArray(dishCategories.id, categoryIds),
        ),
    });

    if (categories.length !== categoryIds.length) {
      throw new BadRequestException("errors.dishes.invalid-category-ids");
    }
  }

  public async create(
    dto: CreateDishDto,
    options: { worker: RequestWorker },
  ): Promise<DishEntity | undefined> {
    const { categoryIds, ...payload } = dto;
    const { worker } = options;

    // Validate menu id
    await this.validateMenuId(dto.menuId, worker);
    await this.validateCategoryIds(dto.menuId, categoryIds);

    const dish = await this.pg.transaction(async (tx) => {
      const [dish] = await tx
        .insert(schema.dishes)
        .values({
          ...payload,
        })
        .returning({
          id: schema.dishes.id,
        });

      if (!dish) {
        throw new ServerErrorException("Failed to create dish");
      }

      await tx.insert(schema.dishesToDishCategories).values(
        categoryIds.map((id) => ({
          dishId: dish.id,
          dishCategoryId: id,
        })),
      );

      return dish;
    });

    return this.findById(dish.id);
  }

  public async update(
    id: string,
    dto: UpdateDishDto,
    options: { worker: RequestWorker },
  ): Promise<DishEntity | undefined> {
    const { categoryIds, ...payload } = dto;
    const { worker } = options;

    worker;

    const dish = await this.pg.query.dishes.findFirst({
      where: (dishes, { eq }) => eq(dishes.id, id),
      columns: {
        menuId: true,
      },
    });

    if (!dish) {
      throw new NotFoundException();
    }

    // We need to make sure that worker has rights to the menu and can update dish
    if (dish.menuId) {
      await this.validateMenuId(dish.menuId, worker);
    }

    if (categoryIds && dish.menuId) {
      await this.validateCategoryIds(dish.menuId, categoryIds);
    }

    if (Object.keys(payload).length === 0) {
      throw new BadRequestException(
        "errors.dishes.you-should-provide-at-least-one-field-to-update",
      );
    }

    await this.pg.transaction(async (tx) => {
      await tx
        .update(schema.dishes)
        .set(payload)
        .where(eq(schema.dishes.id, id));

      if (categoryIds) {
        await tx
          .delete(schema.dishesToDishCategories)
          .where(eq(schema.dishesToDishCategories.dishId, id));

        await tx.insert(schema.dishesToDishCategories).values(
          categoryIds.map((dishCategoryId) => ({
            dishId: id,
            dishCategoryId,
          })),
        );
      }
    });

    return this.findById(id);
  }

  public async findById(id: string): Promise<DishEntity | undefined> {
    const result = await this.pg.query.dishes.findFirst({
      where: eq(schema.dishes.id, id),
      with: {
        dishesToDishCategories: {
          columns: {},
          with: {
            dishCategory: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        },
        dishesToImages: {
          with: {
            imageFile: true,
          },
        },
      },
    });

    if (!result) {
      return undefined;
    }

    return {
      ...result,
      images: result.dishesToImages
        .sort((a, b) => a.sortIndex - b.sortIndex)
        .map((di) => ({
          ...di.imageFile,
          alt: di.alt,
          sortIndex: di.sortIndex,
        })),
      categories: result.dishesToDishCategories.map((dc) => dc.dishCategory),
    };
  }
}
