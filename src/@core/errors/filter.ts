import { slugify } from "@core/utils/slugify";
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";

import { ErrorInstance } from "./index.types";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const response = (exception as any)?.response as ErrorInstance;
    const statusCode = (exception as { status: number })?.status;
    const url = httpAdapter.getRequestUrl(ctx.getRequest());
    const uri = new URL("http://localhost" + url);

    const errorCategory = slugify(uri.pathname.split("/")?.[1]).toUpperCase();

    httpAdapter.reply(
      ctx.getResponse(),
      {
        statusCode,
        // @ts-expect-error response is not defined
        errorCode: response?.errorCode,
        errorCategory,
        errorSubCode: null,
        ...(typeof response?.message === "object" &&
        "title" in response?.message
          ? {
              errorSubCode: slugify(response.message.title),
            }
          : {}),
        ...response,
        pathname: uri.pathname,
        timestamp: Date.now(),
      },
      statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
