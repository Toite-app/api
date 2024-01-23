import * as ms from "@lukeed/ms";
import { Request } from "@core/interfaces/request";
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { SessionsService } from "src/sessions/sessions.service";
import { Response } from "@core/interfaces/response";
import { AUTH_COOKIES } from "../auth.types";
import { UnauthorizedException } from "@core/errors/exceptions/unauthorized.exception";

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly sessionsService: SessionsService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest() as Request;
    const res = context.switchToHttp().getResponse() as Response;

    const ip = req.ip;
    const token = req.cookies?.[AUTH_COOKIES.token];
    const httpAgent = String(
      req.headers["user-agent"] || req.headers["User-Agent"] || "N/A",
    );

    if (!token) return false;

    const isValid = await this.sessionsService.isSessionValid(token);

    if (!isValid) return false;

    const session = await this.sessionsService.findByToken(token);

    const isCompromated =
      session.ipAddress !== ip || session.httpAgent !== httpAgent;

    if (isCompromated) {
      // TODO: Implement logic for notification about compromated session
      throw new UnauthorizedException("Session is compromated");
    }

    // Refresh session every 30 minutes
    const isTimeToRefresh =
      new Date(session.refreshedAt).getTime() + ms.parse("30m") <
      new Date().getTime();

    if (isTimeToRefresh) {
      const newToken = await this.sessionsService.refresh(token);

      res.cookie(AUTH_COOKIES.token, newToken, {
        maxAge: 1000 * 60 * 60 * 24 * 365,
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
    }

    return true;
  }
}
