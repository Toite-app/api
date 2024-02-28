import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import slugify from "slugify";
import { ErrorInstance } from "./index.types";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const response = (exception as any)?.response as ErrorInstance;
    const statusCode = (exception as { status: number })?.status;
    const url = httpAdapter.getRequestUrl(ctx.getRequest());
    const uri = new URL("http://localhost" + url);

    httpAdapter.reply(
      ctx.getResponse(),
      {
        statusCode,
        ...(typeof response?.message === "object" &&
        "title" in response?.message
          ? {
              errorCode: response.errorCode,
              errorSubCode: slugify(response.message.title, {
                lower: true,
                remove: /[*+~.()'"!:@]/g,
              }),
              errorFullCode: `${response.errorCode}.${slugify(
                response.message.title,
                {
                  lower: true,
                  remove: /[*+~.()'"!:@]/g,
                },
              )}`,
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
