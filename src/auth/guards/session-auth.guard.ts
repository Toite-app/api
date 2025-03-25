import env from "@core/env";
import { UnauthorizedException } from "@core/errors/exceptions/unauthorized.exception";
import { Request } from "@core/interfaces/request";
import { Response } from "@core/interfaces/response";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import * as requestIp from "@supercharge/request-ip";
import { RedlockService } from "src/@base/redlock/redlock.service";
import { AUTH_COOKIES } from "src/auth/auth.types";
import { IS_PUBLIC_KEY } from "src/auth/decorators/public.decorator";
import { SessionsService } from "src/auth/services/sessions.service";

@Injectable()
export class SessionAuthGuard implements CanActivate {
  private readonly logger = new Logger(SessionAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly sessionsService: SessionsService,
    private readonly redlockService: RedlockService,
  ) {}

  private getUserIp(req: Request) {
    return requestIp.getClientIp(req);
  }

  private getUserAgent(req: Request) {
    return String(
      req.headers["user-agent"] || req.headers["User-Agent"] || "N/A",
    );
  }

  private getCookie(req: Request, cookieName: string) {
    return req.cookies?.[cookieName];
  }

  private async _isPublic(context: ExecutionContext) {
    const isPublic = !!this.reflector.get(IS_PUBLIC_KEY, context.getHandler());

    return isPublic;
  }

  private async _isRefreshDisabled(req: Request) {
    return !!req.headers["x-disable-session-refresh"];
  }

  private async _handleSession(req: Request, res: Response) {
    const jwtSign = this.getCookie(req, AUTH_COOKIES.token);

    if (!jwtSign) throw new UnauthorizedException();

    const httpAgent = this.getUserAgent(req);
    const ip = this.getUserIp(req);

    const session = await this.sessionsService.validateSession(jwtSign, {
      httpAgent,
      ip,
    });

    if (!session) throw new UnauthorizedException();

    req.session = session;
    req.worker = session?.worker ?? null;

    const isRefreshDisabled = await this._isRefreshDisabled(req);
    const isRequireRefresh =
      this.sessionsService.isSessionRequireRefresh(session);

    if (isRequireRefresh && !isRefreshDisabled) {
      let lock;
      try {
        // Try to acquire the lock with no retries and minimal retry delay
        lock = await this.redlockService.acquire(
          [`session-refresh:${session.id}`],
          10000, // 10 second lock duration
          {
            retryCount: 0, // Don't retry if lock can't be acquired
            retryDelay: 0,
          },
        );
      } catch (error) {
        // If we couldn't acquire the lock, another request is handling the refresh
        // Just continue without refreshing
        return true;
      }

      try {
        const newSignedJWT = await this.sessionsService.refreshSignedSession(
          jwtSign,
          {
            httpAgent,
            ip: ip ?? "N/A",
          },
        );

        res.setCookie(AUTH_COOKIES.token, newSignedJWT, {
          maxAge: 60 * 60 * 24 * 365, // 1 year
          httpOnly: true,
          secure: env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
        });
      } finally {
        if (lock) {
          await this.redlockService.release(lock);
        }
      }
    }

    return true;
  }

  async canActivate(context: ExecutionContext) {
    // If session is not required, we can activate the guard from start
    if (await this._isPublic(context)) {
      return true;
    }

    const req = context.switchToHttp().getRequest() as Request;
    const res = context.switchToHttp().getResponse() as Response;

    // Check if valid, throw if not and perform update if needed
    await this._handleSession(req, res);

    return true;
  }
}
