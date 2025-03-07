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
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
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

  public async create(
    dto: CreateDishDto,
    options: { worker: RequestWorker },
  ): Promise<DishEntity | undefined> {
    const { worker } = options;

    // Validate menu id
    await this.validateMenuId(dto.menuId, worker);

    const [dish] = await this.pg
      .insert(schema.dishes)
      .values({
        ...dto,
      })
      .returning();

    if (!dish) {
      throw new ServerErrorException("Failed to create dish");
    }

    return { ...dish, images: [] };
  }

  public async update(
    id: string,
    payload: UpdateDishDto,
    options: { worker: RequestWorker },
  ): Promise<DishEntity | undefined> {
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

    if (Object.keys(payload).length === 0) {
      throw new BadRequestException(
        "errors.dishes.you-should-provide-at-least-one-field-to-update",
      );
    }

    await this.pg
      .update(schema.dishes)
      .set(payload)
      .where(eq(schema.dishes.id, id));

    return this.findById(id);
  }

  public async findById(id: string): Promise<DishEntity | undefined> {
    const result = await this.pg.query.dishes.findFirst({
      where: eq(schema.dishes.id, id),
      with: {
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
    };
  }
}
