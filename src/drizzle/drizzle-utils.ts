import { FilterCondition, IFilters } from "@core/decorators/filter.decorator";
import { and, sql } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";

export class DrizzleUtils {
  public static buildFilterConditions<T extends PgTable>(
    table: T,
    filters?: IFilters,
  ) {
    if (!filters?.filters?.length) return undefined;

    const conditions = filters.filters
      .map((filter) => {
        switch (filter.condition) {
          case FilterCondition.Equals:
            return sql`${table[filter.field]} = ${filter.value}`;
          case FilterCondition.NotEquals:
            return sql`${table[filter.field]} != ${filter.value}`;
          case FilterCondition.Contains:
            return sql`${table[filter.field]} ILIKE ${`%${filter.value}%`}`;
          case FilterCondition.NotContains:
            return sql`${table[filter.field]} NOT ILIKE ${`%${filter.value}%`}`;
          case FilterCondition.StartsWith:
            return sql`${table[filter.field]} ILIKE ${`${filter.value}%`}`;
          case FilterCondition.EndsWith:
            return sql`${table[filter.field]} ILIKE ${`%${filter.value}`}`;
          default:
            return undefined;
        }
      })
      .filter(Boolean);

    return conditions.length > 1 ? and(...conditions) : conditions[0];
  }
}
