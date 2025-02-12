import { Request } from "@core/interfaces/request";
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import * as requestIp from "@supercharge/request-ip";
import { I18nContext } from "nestjs-i18n";
import { Observable, tap } from "rxjs";
import { v4 as uuidv4 } from "uuid";

import { AuditLogsProducer } from "./audit-logs.producer";
import {
  AUDIT_LOG_OPTIONS,
  AuditLogOptions,
  IS_AUDIT_LOG_ENABLED,
} from "./decorators/audit-logs.decorator";

@Injectable()
export class AuditLogsInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogsProducer: AuditLogsProducer,
  ) {}

  public readonly sensitiveFields = ["password", "token", "refreshToken"];

  public readonly sensitiveFieldsRegex = new RegExp(
    this.sensitiveFields.join("|"),
    "gi",
  );

  public filterSensitiveFields(obj: any) {
    if (!obj) return {};
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        this.sensitiveFieldsRegex.test(key) ? "****" : value,
      ]),
    );
  }

  public getUserAgent(request: Request) {
    return (
      request.headers["user-agent"] ?? (request.headers["User-Agent"] as string)
    );
  }

  public getIpAddress(request: Request) {
    return requestIp.getClientIp(request);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const timestamp = Date.now();

    request.timestamp = timestamp;

    const isEnabled = this.reflector.get<boolean>(
      IS_AUDIT_LOG_ENABLED,
      context.getHandler(),
    );

    if (!isEnabled) {
      return next.handle();
    }

    const options =
      this.reflector.get<AuditLogOptions>(
        AUDIT_LOG_OPTIONS,
        context.getHandler(),
      ) ?? {};

    const startTime = Date.now();
    request.requestId = request?.requestId ?? uuidv4();

    const body = this.filterSensitiveFields(request.body);
    const params = this.filterSensitiveFields(request.params);
    const query = this.filterSensitiveFields(request.query);
    const headers = this.filterSensitiveFields(request.headers);

    const userAgent = this.getUserAgent(request);
    const ipAddress = this.getIpAddress(request);

    // Extract session and worker IDs
    const sessionId = request.session?.id;
    const workerId = request.worker?.id;

    return next.handle().pipe(
      tap({
        next: (response) => {
          if (options.onlyErrors) {
            return;
          }

          const duration = Date.now() - startTime;

          this.auditLogsProducer.create({
            method: request.method,
            url: request.url,
            params,
            query,
            body,
            headers,
            userAgent,
            ipAddress,
            userId: request.user?.id,
            sessionId,
            workerId,
            response,
            statusCode: context.switchToHttp().getResponse().statusCode,
            duration,
            requestId: request.requestId,
            origin: request.headers.origin,
            isFailed: false,
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const i18n = I18nContext.current();

          this.auditLogsProducer.create({
            method: request.method,
            url: request.url,
            params,
            query,
            body,
            headers,
            userAgent,
            ipAddress,
            userId: request.user?.id,
            sessionId,
            workerId,
            error: {
              message: error.message,
              messageI18n: i18n?.t(error.message),
              stack: error.stack,
              name: error.name,
              code: error.code,
            },
            statusCode: error?.status ?? 500,
            duration,
            requestId: request.requestId,
            origin: request.headers.origin,
            isFailed: true,
          });
        },
      }),
    );
  }
}
