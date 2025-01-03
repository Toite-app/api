import { IncomingHttpHeaders } from "http";

import { UnauthorizedException } from "@core/errors/exceptions/unauthorized.exception";
import { Injectable } from "@nestjs/common";
import * as argon2 from "argon2";
import { SessionsService } from "src/sessions/sessions.service";
import { WorkerEntity } from "src/workers/entities/worker.entity";
import { WorkersService } from "src/workers/workers.service";

import { SignInDto } from "../dto/req/sign-in.dto";

@Injectable()
export class AuthService {
  constructor(
    private workersService: WorkersService,
    private readonly sessionsService: SessionsService,
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

  public async createSession(data: {
    worker: WorkerEntity;
    headers: IncomingHttpHeaders;
    ipAddress: string;
  }) {
    const { worker, headers, ipAddress } = data;

    const httpAgent = String(
      headers["user-agent"] || headers["User-Agent"] || "N/A",
    );

    const created = await this.sessionsService.create({
      workerId: worker.id,
      httpAgent,
      ipAddress,
    });

    if (!created) {
      throw new UnauthorizedException("Failed to create session");
    }

    return await this.sessionsService.findByToken(created.token);
  }

  public async destroySession(token: string) {
    return await this.sessionsService.destroy(token);
  }
}
