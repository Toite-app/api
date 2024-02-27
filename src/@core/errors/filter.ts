import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import slugify from "slugify";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const response = (exception as any)?.response;
    const path = httpAdapter.getRequestUrl(ctx.getRequest());

    const responseBody = {
      ...response,
      ...(typeof response.message === "string"
        ? {
            errorCode:
              `${path}::` +
              slugify(response.message, {
                lower: true,
                remove: /[*+~.()'"!:@]/g,
              }),
          }
        : {}),
    };

    httpAdapter.reply(
      ctx.getResponse(),
      responseBody,
      response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
