import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import * as ms from "@lukeed/ms";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Response } from "@core/interfaces/response";
import { AUTH_COOKIES } from "../auth.types";

/**
 * Set cookies interceptor sets cookies parameters to response
 * @see [Interceptors - NestJS](https://docs.nestjs.com/interceptors)
 * @see [Cookies - NestJS](https://docs.nestjs.com/techniques/cookies)
 */
@Injectable()
export class SetCookiesInterceptor implements NestInterceptor {
  /**
   * Implements interception logic
   * @param context Execution context which describes current request pipeline
   * @param next Object which provides access to response RxJS stream
   */
  public intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    return next.handle().pipe(
      map((data: Partial<{ setSessionToken?: string }>) => {
        const res = context.switchToHttp().getResponse() as Response;

        if (data?.setSessionToken) {
          res.cookie(AUTH_COOKIES.token, data.setSessionToken, {
            maxAge: ms.parse("1y"),
            httpOnly: true,
            secure: true,
            sameSite: "none",
          });
        }

        return data;
      }),
    );
  }
}
