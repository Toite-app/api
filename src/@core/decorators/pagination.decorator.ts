import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { Request } from "@core/interfaces/request";
import { addMetadata } from "@core/utils/addMetadata";
import { createParamDecorator } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";

export const PAGINATION_DEFAULT_PAGE = 1;
export const PAGINATION_DEFAULT_LIMIT = 50;

export type PaginationParams = {
  default?: {
    page?: number;
    limit?: number;
  };
};

export interface IPagination {
  page: number;
  size: number;
  limit: number;
  offset: number;
}

type QueryParams = {
  page?: string;
  size?: string;
};

export const PaginationParams = createParamDecorator(
  (options: PaginationParams, ctx: ExecutionContextHost): IPagination => {
    const defaultPage = options?.default?.page ?? PAGINATION_DEFAULT_PAGE;
    const defaultLimit = options?.default?.limit ?? PAGINATION_DEFAULT_LIMIT;

    const req = ctx.switchToHttp().getRequest() as Request;

    const page = Number((req.query as QueryParams)?.page || defaultPage);
    const size = Number((req.query as QueryParams)?.size || defaultLimit);

    if (isNaN(page) || page < 1 || isNaN(size) || size < 1) {
      throw new BadRequestException("errors.common.invalid-pagination-params", {
        property: "page",
      });
    }

    // do not allow to fetch large slices of the dataset
    if (size > 100) {
      throw new BadRequestException("errors.common.invalid-pagination-size", {
        property: "size",
      });
    }

    return {
      page,
      limit: size,
      size,
      offset: (page - 1) * size,
    };
  },
  [
    addMetadata([
      {
        in: "query",
        name: "page",
        type: "integer",
        description: "Pagination page (starts from 1)",
        required: false,
        example: 1,
      },
      {
        in: "query",
        name: "size",
        type: "integer",
        description: "Pagination size (max 100)",
        required: false,
        example: 50,
      },
    ]),
  ],
);
