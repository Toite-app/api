import { Request } from "@core/interfaces/request";
import { addMetadata } from "@core/utils/addMetadata";
import { createParamDecorator } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";

type QueryParams = {
  search?: string;
};

const SearchParam = createParamDecorator(
  (options: any, ctx: ExecutionContextHost): string | null => {
    const req = ctx.switchToHttp().getRequest() as Request;
    const search = (req.query as QueryParams)?.search ?? null;

    if (typeof search === "string" && search.length > 0) {
      return search;
    }

    return null;
  },
  [
    addMetadata([
      {
        in: "query",
        name: "search",
        type: "string",
        description: "Search query string",
        required: false,
        example: "pizza",
      },
    ]),
  ],
);

export default SearchParam;
