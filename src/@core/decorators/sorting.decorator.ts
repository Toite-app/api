import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { Request } from "@core/interfaces/request";
import { addMetadata } from "@core/utils/addMetadata";
import { createParamDecorator } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";

export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

export interface ISorting {
  sortBy: string;
  sortOrder: SortOrder;
}

export type SortingParamsOptions = {
  fields: string[];
};

export const SortingParams = createParamDecorator(
  (options: SortingParamsOptions, ctx: ExecutionContextHost): ISorting => {
    const { fields } = options;
    const req = ctx.switchToHttp().getRequest() as Request;
    const sortBy = req.query?.sortBy;
    const sortOrder = req.query?.sortOrder;

    if (!sortBy && !sortOrder) {
      return {
        sortBy: "id",
        sortOrder: SortOrder.ASC,
      };
    }

    if (typeof sortBy !== "string") {
      throw new BadRequestException({
        title: "Invalid sortBy",
        description: `sortBy should be a string, but got ${typeof sortBy}`,
      });
    }

    if (typeof sortOrder !== "string") {
      throw new BadRequestException({
        title: "Invalid sortOrder",
        description:
          "sortOrder should be a string, but got " + typeof sortOrder,
      });
    }

    if (!fields.includes(sortBy)) {
      throw new BadRequestException(
        // "Allowed fields for sortBy: " + fields.join(", "),
        {
          title: "Invalid sortBy field",
          description: "Allowed fields for sortBy: " + fields.join(", "),
          details: fields,
        },
      );
    }

    if (sortOrder !== SortOrder.ASC && sortOrder !== SortOrder.DESC) {
      throw new BadRequestException({
        title: "Invalid sortOrder value",
        description: `sortOrder should be either "asc" or "desc", but got "${sortOrder}"`,
      });
    }

    return {
      sortBy,
      sortOrder,
    };
  },
  [
    addMetadata([
      {
        in: "query",
        name: "sortBy",
        type: "string",
        description: "Field key to sort by",
        required: false,
        example: "id",
      },
      {
        in: "query",
        name: "sortOrder",
        type: "string",
        description: "Sort order",
        required: false,
        example: "asc",
      },
    ]),
  ],
);
