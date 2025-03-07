import { IFilters } from "@core/decorators/filter.decorator";
import {
  IPagination,
  PAGINATION_DEFAULT_LIMIT,
} from "@core/decorators/pagination.decorator";
import { ISorting } from "@core/decorators/sorting.decorator";
import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { ServerErrorException } from "@core/errors/exceptions/server-error.exception";
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

    const query = this.pg.query.dishes.findMany({
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

    const result = await query;

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

  public async create(dto: CreateDishDto): Promise<DishEntity | undefined> {
    const dishes = await this.pg
      .insert(schema.dishes)
      .values({
        ...dto,
      })
      .returning();

    const dish = dishes[0];
    if (!dish) {
      throw new ServerErrorException("Failed to create dish");
    }

    return { ...dish, images: [] };
  }

  public async update(
    id: string,
    dto: UpdateDishDto,
  ): Promise<DishEntity | undefined> {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        "You should provide at least one field to update",
      );
    }

    await this.pg
      .update(schema.dishes)
      .set(dto)
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
