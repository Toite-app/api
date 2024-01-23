import { Inject, Injectable } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import * as schema from "@postgress-db/schema";
import { SessionPayloadDto } from "./dto/session-payload";
import { handleError } from "@core/errors/handleError";
import { eq } from "drizzle-orm";

@Injectable()
export class SessionsService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
  ) {}

  public findByRefreshToken(refreshToken: string) {
    try {
      return this.pg.query.sessions.findFirst({
        where: eq(schema.sessions.refreshToken, refreshToken),
      });
    } catch (err) {
      handleError(err);
    }
  }

  public async create(dto: SessionPayloadDto) {
    try {
      const { workerId, httpAgent, refreshToken, ipAddress } = dto;

      return await this.pg.insert(schema.sessions).values({
        workerId,
        httpAgent,
        refreshToken,
        ipAddress,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (err) {
      handleError(err);
    }
  }
}
