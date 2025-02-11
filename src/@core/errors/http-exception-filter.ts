// import { ValidationError } from "@i18n-class-validator";
import { ErrorInstance } from "@core/errors/index.types";
import { Request } from "@core/interfaces/request";
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

  private getError(exception: HttpException) {
    const i18n = I18nContext.current();
    const response = exception.getResponse() as ErrorInstance;

    if (!response || !response?.errorCode) return null;

    const tKey = response?.message ?? `errors.${response.errorCode}`;
    const message = i18n?.t(tKey) ?? response?.message ?? null;

    return {
      message,
      validationError:
        !!message && response.options?.property
          ? ({
              property: response.options.property,
              constraints: {
                exception: String(message),
              },
            } as IValidationError)
          : null,
    };
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest() as Request;
    const response = ctx.getResponse();
    const statusCode = exception.getStatus();

    const timestamp = request.timestamp ?? new Date().getTime();
    const error = this.getError(exception);

    const validationErrors = [
      ...(this.getValidationErrors(exception) ?? []),
      ...(error?.validationError ? [error.validationError] : []),
    ].filter(Boolean);

    const message = error?.message ?? exception.message;

    response.status(statusCode).json({
      statusCode,
      ...(request?.requestId ? { requestId: request.requestId } : {}),
      path: request.url,
      timestamp,
      message,
      ...(validationErrors && validationErrors.length > 0
        ? { validationErrors }
        : {}),
    });
  }
}
