import { Request } from "@core/interfaces/request";
import { StringValuePipe } from "@core/pipes/string.pipe";
import { addMetadata } from "@core/utils/addMetadata";
import { createParamDecorator } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";

type QueryParams = {
  search?: string;
};

// @deprecated cause of ValidationPipe
const SearchQuery = createParamDecorator(
  (options: any, ctx: ExecutionContextHost): string | null => {
    const req = ctx.switchToHttp().getRequest() as Request;
    const search = (req.query as QueryParams)?.search ?? null;

    const pipe = new StringValuePipe();

    const transformed = pipe.transform(String(search), {
      type: "query",
      data: "search",
    });

    return transformed;
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

export default SearchQuery;
