import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { Request } from "@core/interfaces/request";
import { addMetadata } from "@core/utils/addMetadata";
import { createParamDecorator } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";

export interface ICursorParams {
  default?: {
    limit?: number;
  };
}

export interface ICursor {
  cursorId: string | null;
  limit: number;
}

export const CURSOR_DEFAULT_LIMIT = 50;

type QueryParams = {
  cursorId?: string;
  limit?: string;
};

export const CursorParams = createParamDecorator(
  (options: ICursorParams, ctx: ExecutionContextHost): ICursor => {
    const req = ctx.switchToHttp().getRequest() as Request;

    const cursorId = (req.query as QueryParams)?.cursorId ?? null;
    const limit =
      (req.query as QueryParams)?.limit ??
      options?.default?.limit ??
      CURSOR_DEFAULT_LIMIT;

    if (!!cursorId && typeof cursorId !== "string") {
      throw new BadRequestException("errors.common.invalid-cursor-id");
    }

    if (isNaN(Number(limit)) || Number(limit) < 1) {
      throw new BadRequestException("errors.common.invalid-limit-value");
    }

    if (!!limit && Number(limit) > 1000) {
      throw new BadRequestException("errors.common.limit-too-big");
    }

    return {
      cursorId,
      limit: Number(limit),
    };
  },
  [
    addMetadata([
      {
        in: "query",
        name: "cursorId",
        type: "string",
        description: "Cursor id",
        required: false,
        example: "123",
      },
      {
        in: "query",
        name: "limit",
        type: "number",
        description: "Limit",
        required: false,
        example: 50,
      },
    ]),
  ],
);
