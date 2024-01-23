import { Inject, Injectable } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import * as schema from "@postgress-db/schema";
import { SessionPayloadDto } from "./dto/session-payload";
import { handleError } from "@core/errors/handleError";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { UnauthorizedException } from "@core/errors/exceptions/unauthorized.exception";

@Injectable()
export class SessionsService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
  ) {}

  private generateToken() {
    return `v1-${uuidv4()}-${uuidv4()}-${uuidv4()}-${uuidv4()}`;
  }

  public async findByToken(token: string) {
    try {
      const result = await this.pg.query.sessions.findFirst({
        where: eq(schema.sessions.token, token),
      });

      return result;
    } catch (err) {
      handleError(err);
    }
  }

  public async create(dto: SessionPayloadDto) {
    try {
      const { workerId, httpAgent, ipAddress } = dto;
      const token = this.generateToken();

      return await this.pg
        .insert(schema.sessions)
        .values({
          workerId,
          httpAgent,
          token,
          ipAddress,
          refreshedAt: new Date(),
        })
        .returning({
          id: schema.sessions.id,
          token: schema.sessions.token,
        })
        .then((result) => {
          return result?.[0];
        });
    } catch (err) {
      handleError(err);
    }
  }

  public async refresh(token: string) {
    try {
      if (!(await this.isSessionValid(token))) {
        throw new UnauthorizedException("Session is expired");
      }

      const newToken = this.generateToken();

      const session = await this.pg
        .update(schema.sessions)
        .set({
          token: newToken,
          refreshedAt: new Date(),
        })
        .where(eq(schema.sessions.token, token));

      return session;
    } catch (err) {
      handleError(err);
    }
  }

  public async isSessionValid(token: string) {
    try {
      const session = await this.findByToken(token);

      if (!session) return false;

      // If session is older than 7 days, it's expired
      const isExpired =
        session.refreshedAt.getTime() + 1000 * 60 * 60 * 24 * 7 < Date.now();

      return !isExpired;
    } catch (err) {
      handleError(err);
    }
  }
}
