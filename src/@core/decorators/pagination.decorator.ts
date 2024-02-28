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

export const PaginationParams = createParamDecorator(
  (options: PaginationParams, ctx: ExecutionContextHost): IPagination => {
    const {
      default: {
        page: defaultPage = PAGINATION_DEFAULT_PAGE,
        limit: defaultLimit = PAGINATION_DEFAULT_LIMIT,
      },
    } = options || { default: {} };

    const req = ctx.switchToHttp().getRequest() as Request;

    const page = Number(req.query?.page || defaultPage);
    const size = Number(req.query?.size || defaultLimit);

    if (isNaN(page) || page < 1 || isNaN(size) || size < 1) {
      throw new BadRequestException({
        title: "Invalid pagination params",
        description: "Page and size should be positive integers",
      });
    }

    // do not allow to fetch large slices of the dataset
    if (size > 100) {
      throw new BadRequestException({
        title: "Invalid pagination size",
        description: "Max size is 100",
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
