import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Response } from "@core/interfaces/response";
import { AUTH_COOKIES } from "../auth.types";
import { AuthTokenEntity } from "../entities/auth-token.entity";

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
      map((data: Partial<{ refreshToken?: AuthTokenEntity }>) => {
        const res = context.switchToHttp().getResponse() as Response;

        if (data.refreshToken) {
          res.cookie(AUTH_COOKIES.refreshToken, data.refreshToken.value, {
            expires: new Date(data.refreshToken.expiresAt),
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
