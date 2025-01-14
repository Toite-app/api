import { UnauthorizedException } from "@core/errors/exceptions/unauthorized.exception";
import { Inject, Injectable } from "@nestjs/common";
import * as argon2 from "argon2";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { SignInDto } from "src/auth/dto/req/sign-in.dto";
import { PG_CONNECTION } from "src/constants";
import { WorkerEntity } from "src/workers/entities/worker.entity";
import { WorkersService } from "src/workers/workers.service";
import { schema } from "test/helpers/db";

import { SessionsService } from "./sessions.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly workersService: WorkersService,
    private readonly sessionsService: SessionsService,
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
  ) {}

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
    return this.sessionsService.createSignedSession(data);
  }

  public async refreshSignedSession(
    signed: string,
    options: {
      httpAgent: string;
      ip: string;
    },
  ) {
    return this.sessionsService.refreshSignedSession(signed, options);
  }

  public async validateSession(
    signed: string,
    options?: {
      httpAgent?: string;
      ip?: string;
    },
  ) {
    return this.sessionsService.validateSession(signed, options);
  }
}
