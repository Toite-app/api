import { UnauthorizedException } from "@core/errors/exceptions/unauthorized.exception";
import { handleError } from "@core/errors/handleError";
import { Inject, Injectable } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import { ISession, sessions } from "@postgress-db/schema/sessions";
import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { v4 as uuidv4 } from "uuid";

import { SessionPayloadDto } from "./dto/session-payload";

@Injectable()
export class SessionsService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
  ) {}

  private generateToken() {
    return `v1-${uuidv4()}-${uuidv4()}-${uuidv4()}-${uuidv4()}`;
  }

  public async findByToken(token: string): Promise<ISession | undefined> {
    try {
      const result = await this.pg.query.sessions.findFirst({
        where: eq(schema.sessions.token, token),
      });

      return result;
    } catch (err) {
      handleError(err);
    }
  }

  public async create(
    dto: SessionPayloadDto,
  ): Promise<Pick<ISession, "id" | "token"> | undefined> {
    try {
      const { workerId, httpAgent, ipAddress } = dto;
      const token = this.generateToken();

      return await this.pg
        .insert(sessions)
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

  public async refresh(token: string): Promise<string | undefined> {
    try {
      if (!(await this.isSessionValid(token))) {
        throw new UnauthorizedException("Session is expired");
      }

      const newToken = this.generateToken();

      await this.pg
        .update(schema.sessions)
        .set({
          token: newToken,
          // refreshedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.sessions.token, token));

      return newToken;
    } catch (err) {
      handleError(err);
    }
  }

  public async isSessionValid(token: string): Promise<boolean> {
    try {
      const session = await this.findByToken(token);

      if (!session || !session?.refreshedAt) return false;

      // If session is older than 7 days, it's expired
      const isExpired =
        session.refreshedAt.getTime() + 1000 * 60 * 60 * 24 * 7 < Date.now();

      return !isExpired;
    } catch (err) {
      handleError(err);
      return false;
    }
  }

  public async destroy(token: string): Promise<boolean> {
    try {
      await this.pg
        .delete(schema.sessions)
        .where(eq(schema.sessions.token, token));

      return true;
    } catch (err) {
      handleError(err);
      return false;
    }
  }
}
