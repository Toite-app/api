import env from "@core/env";
import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { UnauthorizedException } from "@core/errors/exceptions/unauthorized.exception";
import { Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { schema } from "@postgress-db/drizzle.module";
import { ISession, sessions } from "@postgress-db/schema/sessions";
import { workers } from "@postgress-db/schema/workers";
import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { SessionTokenPayload } from "src/auth/auth.types";
import { PG_CONNECTION } from "src/constants";
import { v4 as uuidv4 } from "uuid";

export const SESSION_TOKEN_GRACE_PERIOD = env.JWT.GRACE_PERIOD;
export const SESSION_TOKEN_REFRESH_INTERVAL = env.JWT.REFRESH_INTERVAL;
export const SESSION_TOKEN_EXPIRES_IN = env.JWT.EXPIRES_IN;

@Injectable()
export class SessionsService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
  ) {}

  private async _getWorker(workerId: string) {
    const worker = await this.pg.query.workers.findFirst({
      where: eq(workers.id, workerId),
      with: {
        workersToRestaurants: {
          columns: {
            restaurantId: true,
          },
        },
      },
      columns: {
        id: true,
        name: true,
        login: true,
        role: true,
        isBlocked: true,
      },
    });

    if (!worker) {
      throw new BadRequestException();
    }

    return worker;
  }

  public async createSignedSession(data: {
    worker: { id: string };
    httpAgent: string;
    ip: string;
  }) {
    const { worker, httpAgent, ip } = data;

    const { sessionId, signed } = await this.generateSignedSession({
      workerId: worker.id,
      httpAgent,
      ip,
    });

    await this.pg.insert(sessions).values({
      id: sessionId,
      workerId: worker.id,
      ip,
      httpAgent,
      refreshedAt: new Date(),
    });

    return signed;
  }

  public async refreshSignedSession(
    signed: string,
    options: {
      httpAgent: string;
      ip: string;
    },
  ) {
    const { httpAgent, ip } = options;
    const decoded = await this.decodeSession(signed);

    if (!decoded) {
      throw new UnauthorizedException();
    }

    const { sessionId, workerId } = decoded;

    const refreshed = await this.generateSignedSession({
      prevSign: signed,
      workerId,
      httpAgent,
      ip,
    });

    await this.pg
      .update(sessions)
      .set({
        id: refreshed.sessionId,
        previousId: sessionId,
        refreshedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId));

    return refreshed.signed;
  }

  public generateSessionId() {
    return `${uuidv4()}`;
  }

  public async generateSignedSession(options: {
    prevSign?: string;
    workerId: string;
    httpAgent: string;
    ip: string;
  }) {
    const { prevSign, workerId, httpAgent, ip } = options;

    const previous = await this.decodeSession(prevSign);

    const sessionId = this.generateSessionId();
    const worker = await this._getWorker(workerId);

    const payload: SessionTokenPayload = {
      sessionId,
      workerId,
      worker,
      httpAgent,
      ip,
      version: previous ? previous.version + 1 : 1,
    };

    const signed = this.jwtService.sign(payload, {
      expiresIn: SESSION_TOKEN_EXPIRES_IN,
    });

    return {
      sessionId,
      payload,
      signed,
    };
  }

  public async decodeSession(
    signed?: string,
  ): Promise<SessionTokenPayload | null> {
    if (!signed) {
      return null;
    }

    const decoded = this.jwtService.decode(signed);

    if (!decoded) {
      return null;
    }

    return decoded satisfies SessionTokenPayload;
  }

  public async isSignValid(signed: string) {
    try {
      await this.jwtService.verify(signed);
      return true;
    } catch (error) {
      return false;
    }
  }

  public isSessionExpired(session: Pick<ISession, "refreshedAt">) {
    const now = new Date();
    const refreshed = new Date(session.refreshedAt);

    return (
      now.getTime() - refreshed.getTime() > SESSION_TOKEN_EXPIRES_IN * 1000
    );
  }

  public isDateInGracePeriod(refreshedAt: Date | string) {
    const now = new Date();
    const refreshed = new Date(refreshedAt);

    return (
      now.getTime() - refreshed.getTime() <= SESSION_TOKEN_GRACE_PERIOD * 1000
    );
  }

  public isSessionRequireRefresh(session: Pick<ISession, "refreshedAt">) {
    const now = new Date();
    const refreshed = new Date(session.refreshedAt);

    return (
      now.getTime() - refreshed.getTime() >
      SESSION_TOKEN_REFRESH_INTERVAL * 1000
    );
  }

  public async validateSession(
    signed: string,
    options?: {
      httpAgent?: string;
      ip?: string;
    },
  ) {
    if (!(await this.isSignValid(signed))) {
      return false;
    }

    const decoded = await this.decodeSession(signed);

    if (!decoded) {
      return false;
    }

    const { sessionId, httpAgent } = decoded;

    if (options) {
      if (!!options?.httpAgent && options.httpAgent !== httpAgent) {
        return false;
      }
    }

    const session = await this.pg.query.sessions.findFirst({
      where: (sessions, { eq, or }) =>
        or(eq(sessions.id, sessionId), eq(sessions.previousId, sessionId)),
      with: {
        worker: {
          with: {
            workersToRestaurants: {
              columns: {
                restaurantId: true,
              },
            },
            ownedRestaurants: {
              columns: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!session || !session.isActive) return false;

    if (session.id === sessionId) {
      // Everything is ok
    } else if (session.previousId === sessionId) {
      if (!this.isDateInGracePeriod(session.refreshedAt)) {
        return false;
      }
    } else {
      return false;
    }

    if (this.isSessionExpired(session)) {
      return false;
    }

    // @ts-expect-error dummy error
    delete session.worker.passwordHash;

    return session;
  }
}
