import * as argon2 from "argon2";
import { Injectable } from "@nestjs/common";
import { WorkersService } from "src/workers/workers.service";
import { SignInDto } from "../dto/req/sign-in.dto";
import { WorkerEntity } from "src/workers/entities/worker.entity";
import { SessionsService } from "src/sessions/sessions.service";
import { NotFoundException } from "@core/errors/exceptions/not-found.exception";
import { ForbiddenException } from "@core/errors/exceptions/forbidden.exception";
import { IncomingHttpHeaders } from "http";

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
      throw new NotFoundException("User not found");
    }

    // TODO: Implement logic for timeout in case of wrong password
    if (!(await argon2.verify(worker.passwordHash, password))) {
      throw new ForbiddenException("Wrong password");
    }

    return worker;
  }

  public async obtainSession(data: {
    token?: string;
    worker: WorkerEntity;
    headers: IncomingHttpHeaders;
    ipAddress: string;
  }) {
    const { token, worker, headers, ipAddress } = data;

    const httpAgent = String(
      headers["user-agent"] || headers["User-Agent"] || "N/A",
    );

    if (!token) {
      const created = await this.sessionsService.create({
        workerId: worker.id,
        httpAgent,
        ipAddress,
      });
      return await this.sessionsService.findByToken(created.token);
    }

    const session = await this.sessionsService.findByToken(token);

    const isCompromated =
      session.workerId !== worker.id ||
      session.ipAddress !== ipAddress ||
      session.httpAgent !== httpAgent;

    if (isCompromated) {
      // TODO: Implement logic for compromated sessions
      throw new ForbiddenException();
    }

    await this.sessionsService.refresh(token);

    return await this.sessionsService.findByToken(token);
  }
}
