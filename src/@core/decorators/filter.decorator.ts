import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { Request } from "@core/interfaces/request";
import { addMetadata } from "@core/utils/addMetadata";
import { createParamDecorator } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";

export enum FilterCondition {
  Equals = "equals",
  NotEquals = "notEquals",
  Contains = "contains",
  NotContains = "notContains",
  StartsWith = "startsWith",
  EndsWith = "endsWith",
}

export interface IFilter {
  field: string;
  value: string;
  condition: FilterCondition;
}

export interface IFilters {
  filters: IFilter[];
}

export const FilterParams = createParamDecorator(
  (options: any, ctx: ExecutionContextHost): IFilters => {
    const req = ctx.switchToHttp().getRequest() as Request;
    const rawFilters = req.query?.filters;

    if (!rawFilters) {
      return { filters: [] };
    }

    try {
      const filters = JSON.parse(rawFilters as string);

      if (!Array.isArray(filters)) {
        throw new BadRequestException({
          title: "Invalid filters format",
          description: "Filters should be an array",
        });
      }

      // Validate each filter
      filters.forEach((filter) => {
        if (!filter.field || !filter.value || !filter.condition) {
          throw new BadRequestException({
            title: "Invalid filter format",
            description: "Each filter must have field, value and condition",
          });
        }

        if (!Object.values(FilterCondition).includes(filter.condition)) {
          throw new BadRequestException({
            title: "Invalid filter condition",
            description: `Condition must be one of: ${Object.values(
              FilterCondition,
            ).join(", ")}`,
          });
        }
      });

      return { filters };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException({
        title: "Invalid filters format",
        description: "Could not parse filters JSON",
      });
    }
  },
  [
    addMetadata([
      {
        in: "query",
        name: "filters",
        type: "string",
        description: "JSON string containing filters array",
        required: false,
        example: '[{"field":"name","value":"John","condition":"contains"}]',
      },
    ]),
  ],
);
