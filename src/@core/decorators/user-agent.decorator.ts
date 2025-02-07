import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";

/**
 * Custom decorator to extract the User-Agent header from the request.
 *
 * @param data - Optional data to customize the decorator. Not used in this case.
 * @param ctx - The execution context which contains the HTTP request.
 * @returns The User-Agent string from the request headers.
 */
const UserAgent = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();

    return (
      request.headers["user-agent"] || (request.headers["User-Agent"] as string)
    );
  },
);

export default UserAgent;
