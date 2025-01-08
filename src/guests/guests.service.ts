import { IFilters } from "@core/decorators/filter.decorator";
import {
  IPagination,
  PAGINATION_DEFAULT_LIMIT,
} from "@core/decorators/pagination.decorator";
import { ISorting } from "@core/decorators/sorting.decorator";
import { Inject, Injectable } from "@nestjs/common";
import { DrizzleUtils } from "@postgress-db/drizzle-utils";
import { schema } from "@postgress-db/drizzle.module";
import { asc, count, desc, sql } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { GuestEntity } from "src/guests/entities/guest.entity";

@Injectable()
export class GuestsService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
  ) {}

  public async getTotalCount(filters?: IFilters): Promise<number> {
    const query = this.pg
      .select({
        value: count(),
      })
      .from(schema.guests);

    if (filters) {
      query.where(DrizzleUtils.buildFilterConditions(schema.guests, filters));
    }

    return await query.then((res) => res[0].value);
  }

  public async findMany(options?: {
    pagination?: IPagination;
    sorting?: ISorting;
    filters?: IFilters;
  }): Promise<GuestEntity[]> {
    const { pagination, sorting, filters } = options ?? {};

    const query = this.pg.select().from(schema.guests);

    if (filters) {
      query.where(DrizzleUtils.buildFilterConditions(schema.guests, filters));
    }

    if (sorting) {
      query.orderBy(
        sorting.sortOrder === "asc"
          ? asc(sql.identifier(sorting.sortBy))
          : desc(sql.identifier(sorting.sortBy)),
      );
    }

    return await query
      .limit(pagination?.size ?? PAGINATION_DEFAULT_LIMIT)
      .offset(pagination?.offset ?? 0);
  }
}
