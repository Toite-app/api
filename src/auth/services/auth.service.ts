import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { UnauthorizedException } from "@core/errors/exceptions/unauthorized.exception";
import { Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ISession, sessions } from "@postgress-db/schema/sessions";
import { workers } from "@postgress-db/schema/workers";
import * as argon2 from "argon2";
import { eq, or } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { SessionTokenPayload } from "src/auth/auth.types";
import { SignInDto } from "src/auth/dto/req/sign-in.dto";
import { PG_CONNECTION } from "src/constants";
import { WorkerEntity } from "src/workers/entities/worker.entity";
import { WorkersService } from "src/workers/workers.service";
import { schema } from "test/helpers/db";
import { v4 as uuidv4 } from "uuid";

export const SESSION_TOKEN_GRACE_PERIOD = 60; // 1 minute
export const SESSION_TOKEN_REFRESH_INTERVAL = 60 * 15; // 15 minutes
export const SESSION_TOKEN_EXPIRES_IN = 60 * 60 * 24 * 31; // 31 days

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly workersService: WorkersService,
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
  ) {}

  private async _getWorker(workerId: string) {
    const [worker] = await this.pg
      .select({
        name: workers.name,
        restaurantId: workers.restaurantId,
        login: workers.login,
        role: workers.role,
        isBlocked: workers.isBlocked,
      })
      .from(workers)
      .where(eq(workers.id, workerId));

    if (!worker) {
      throw new BadRequestException();
    }

    return worker;
  }

  public async signIn(dto: SignInDto): Promise<WorkerEntity> {
    const { login, password } = dto;

    const worker = await this.workersService.findOneByLogin(login);

    if (!worker) {
      throw new UnauthorizedException("User not found");
    }

    // TODO: Implement logic for timeout in case of wrong password
    if (!(await argon2.verify(worker.passwordHash, password))) {
      throw new UnauthorizedException("Wrong password");
    }

    return worker;
  }

  public async createSignedSession(data: {
    worker: WorkerEntity;
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

    // Update session in db
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
    //  Something wrong with the sign and that's bad
    //  We will not allow this session
    if (!(await this.isSignValid(signed))) {
      return false;
    }

    const decoded = await this.decodeSession(signed);

    // If decoding is failed there is no sense to check anything
    if (!decoded) {
      return false;
    }

    const { sessionId, httpAgent } = decoded;

    // Options is passing for additional validation of session
    if (options) {
      // If httpAgent is changed there is chance that session is compromised
      if (!!options?.httpAgent && options.httpAgent !== httpAgent) {
        return false;
      }
    }

    // Get session from db by sessionId that can be in id field or previousId field
    const [session] = await this.pg
      .select({
        id: sessions.id,
        previousId: sessions.previousId,
        workerId: sessions.workerId,
        isActive: sessions.isActive,
        refreshedAt: sessions.refreshedAt,
        worker: {
          id: workers.id,
          name: workers.name,
          login: workers.login,
          role: workers.role,
          isBlocked: workers.isBlocked,
          hiredAt: workers.hiredAt,
          firedAt: workers.firedAt,
          onlineAt: workers.onlineAt,
          createdAt: workers.createdAt,
          updatedAt: workers.updatedAt,
          restaurantId: workers.restaurantId,
        },
      })
      .from(sessions)
      .leftJoin(workers, eq(sessions.workerId, workers.id))
      .where(or(eq(sessions.id, sessionId), eq(sessions.previousId, sessionId)))
      .limit(1);

    if (!session || !session.isActive) return false;

    if (session.id === sessionId) {
      // Everything is ok
    } else if (session.previousId === sessionId) {
      // Handle session that was in grace period
      if (!this.isDateInGracePeriod(session.refreshedAt)) {
        return false;
      }
    } else {
      // Session is invalid
      return false;
    }

    if (this.isSessionExpired(session)) {
      return false;
    }

    return session;
  }
}
