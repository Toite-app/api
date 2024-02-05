import * as ms from "@lukeed/ms";
import { Request } from "@core/interfaces/request";
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { SessionsService } from "src/sessions/sessions.service";
import { Response } from "@core/interfaces/response";
import { AUTH_COOKIES } from "../auth.types";
import { UnauthorizedException } from "@core/errors/exceptions/unauthorized.exception";
import { WorkersService } from "src/workers/workers.service";
import { Reflector } from "@nestjs/core";
import { REQUIRE_SESSION_AUTH_KEY } from "../decorators/session-auth.decorator";

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly workersService: WorkersService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isSessionRequired = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_SESSION_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isSessionRequired) return true;

    const req = context.switchToHttp().getRequest() as Request;
    const res = context.switchToHttp().getResponse() as Response;

    const ip = req.ip;
    const token = req.cookies?.[AUTH_COOKIES.token];
    const httpAgent = String(
      req.headers["user-agent"] || req.headers["User-Agent"] || "N/A",
    );

    if (!token) {
      throw new UnauthorizedException();
    }

    const isValid = await this.sessionsService.isSessionValid(token);

    if (!isValid) {
      throw new UnauthorizedException();
    }

    const session = await this.sessionsService.findByToken(token);

    const isCompromated =
      session.ipAddress !== ip || session.httpAgent !== httpAgent;

    if (isCompromated) {
      // TODO: Implement logic for notification about compromated session
      throw new UnauthorizedException("Session is compromated");
    }

    const isTimeToRefresh =
      new Date(session.refreshedAt).getTime() +
        ms.parse(process.env?.SESSION_EXPIRES_IN || "30m") <
      new Date().getTime();

    if (isTimeToRefresh) {
      const newToken = await this.sessionsService.refresh(token);

      res.cookie(AUTH_COOKIES.token, newToken, {
        maxAge: ms.parse("1y"),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
    }

    const worker = await this.workersService.findById(session.workerId);

    const isTimeToUpdateOnline =
      !worker.onlineAt ||
      new Date(worker.onlineAt).getTime() + ms.parse("5m") <
        new Date().getTime();

    if (isTimeToUpdateOnline) {
      await this.workersService.update(worker.id, {
        onlineAt: new Date(),
      });
    }

    req.session = session;
    req.worker = { ...worker, passwordHash: undefined };

    return true;
  }
}
