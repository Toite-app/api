// import { ValidationError } from "@i18n-class-validator";
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import { I18nContext, I18nValidationException } from "nestjs-i18n";
import { formatI18nErrors } from "nestjs-i18n/dist/utils";

export interface IValidationError {
  property: string;
  constraints: Record<string, string>;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private getValidationErrors(
    exception: HttpException,
  ): IValidationError[] | null {
    const i18n = I18nContext.current();

    if (i18n && exception instanceof I18nValidationException) {
      const errors = formatI18nErrors(exception.errors ?? [], i18n.service, {
        lang: i18n.lang,
      });

      return errors.map((error) => ({
        property: error.property,
        constraints: error?.constraints ?? {},
      }));
    }

    return null;
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();
    const statusCode = exception.getStatus();

    const timestamp = new Date().getTime();
    const validationErrors = this.getValidationErrors(exception);

    response.status(statusCode).json({
      statusCode,
      path: request.url,
      timestamp,
      message: exception.message,
      ...(validationErrors ? { validationErrors } : {}),
    });
  }
}
