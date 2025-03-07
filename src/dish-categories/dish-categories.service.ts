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

import { CreateDishCategoryDto } from "./dtos/create-dish-category.dto";
import { UpdateDishCategoryDto } from "./dtos/update-dish-category.dto";
import { DishCategoryEntity } from "./entities/dish-category.entity";

@Injectable()
export class DishCategoriesService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
  ) {}

  public async getTotalCount(filters?: IFilters): Promise<number> {
    const query = this.pg
      .select({
        value: count(),
      })
      .from(schema.dishCategories);

    if (filters) {
      query.where(
        DrizzleUtils.buildFilterConditions(schema.dishCategories, filters),
      );
    }

    return await query.then((res) => res[0].value);
  }

  public async findMany(options?: {
    pagination?: IPagination;
    sorting?: ISorting;
    filters?: IFilters;
  }): Promise<DishCategoryEntity[]> {
    const { pagination, sorting, filters } = options ?? {};

    const conditions: SQL[] = [];

    if (filters) {
      conditions.push(
        DrizzleUtils.buildFilterConditions(
          schema.dishCategories,
          filters,
        ) as SQL,
      );
    }

    const fetchedCategories = await this.pg.query.dishCategories.findMany({
      ...(conditions.length > 0 && { where: and(...conditions) }),
      limit: pagination?.size ?? PAGINATION_DEFAULT_LIMIT,
      offset: pagination?.offset ?? 0,
      orderBy: sorting?.sortBy
        ? [
            sorting.sortOrder === "asc"
              ? asc(sql.identifier(sorting.sortBy))
              : desc(sql.identifier(sorting.sortBy)),
          ]
        : undefined,
    });

    return fetchedCategories;
  }

  public async create(
    dto: CreateDishCategoryDto,
  ): Promise<DishCategoryEntity | undefined> {
    const startIndex = 10;
    const sortIndex = await this.pg
      .select({
        value: count(),
      })
      .from(schema.dishCategories);

    const categories = await this.pg
      .insert(schema.dishCategories)
      .values({
        ...dto,
        sortIndex: sortIndex[0].value + startIndex,
      })
      .returning();

    const category = categories[0];
    if (!category) {
      throw new ServerErrorException(
        "errors.dish-categories.failed-to-create-dish-category",
      );
    }

    return category;
  }

  public async update(
    id: string,
    dto: UpdateDishCategoryDto,
  ): Promise<DishCategoryEntity | undefined> {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        "errors.common.atleast-one-field-should-be-provided",
      );
    }

    await this.pg
      .update(schema.dishCategories)
      .set(dto)
      .where(eq(schema.dishCategories.id, id));

    const result = await this.pg
      .select()
      .from(schema.dishCategories)
      .where(eq(schema.dishCategories.id, id))
      .limit(1);

    return result[0];
  }

  public async findById(id: string): Promise<DishCategoryEntity | undefined> {
    const result = await this.pg
      .select()
      .from(schema.dishCategories)
      .where(eq(schema.dishCategories.id, id))
      .limit(1);

    return result[0];
  }
}
