import { Injectable } from "@nestjs/common";
import { WorkersService } from "src/workers/workers.service";
import { SignInDto } from "../dto/req/sign-in.dto";
import argon2 from "argon2";
import { WorkerEntity } from "src/workers/entities/worker.entity";
import { JwtService } from "@nestjs/jwt";
import { ServerErrorException } from "src/@core/errors/exceptions/server-error.exception";
import { AuthTokenEntity } from "../entities/auth-token.entity";
import { SessionsService } from "src/sessions/sessions.service";
import { handleError } from "@core/errors/handleError";
import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { NotFoundException } from "@core/errors/exceptions/not-found.exception";
import { ForbiddenException } from "@core/errors/exceptions/forbidden.exception";

@Injectable()
export class AuthService {
  constructor(
    private workersService: WorkersService,
    private readonly jwtService: JwtService,
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

  public async getAccessToken(worker: WorkerEntity): Promise<AuthTokenEntity> {
    const payload = {
      id: worker.id,
      login: worker.login,
      role: worker.role,
      name: worker.name,
    };

    const expiresIn = process.env.JWT_EXPIRES_IN;

    if (!expiresIn) {
      throw new ServerErrorException("JWT_EXPIRES_IN not found");
    }

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn,
    });

    const expiresAt = new Date(
      new Date().getTime() + parseInt(expiresIn) * 1000,
    );

    return {
      value: accessToken,
      expiresAt,
    };
  }

  public async getRefreshToken(data: {
    sessionId?: string;
    worker: WorkerEntity;
    httpAgent: string;
    ip: string;
  }): Promise<AuthTokenEntity> {
    try {
      const { sessionId, worker, httpAgent, ip } = data;

      const payload = {
        id: worker.id,
        role: worker.role,
        httpAgent,
        ip,
      };

      const token = this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: "30d",
      });

      const expiresAt = new Date(
        new Date().getTime() + 30 * 24 * 60 * 60 * 1000,
      );

      if (!sessionId) {
        await this.sessionsService.create({
          workerId: worker.id,
          httpAgent,
          ipAddress: ip,
          refreshToken: token,
        });
      }

      return {
        value: token,
        expiresAt,
      };
    } catch (err) {
      handleError(err);
    }
  }

  public async verifyRefreshToken(
    token: string,
    ipAddress: string,
    userAgent: string,
  ) {
    try {
      const session = await this.sessionsService.findByRefreshToken(token);

      if (!session) {
        throw new NotFoundException();
      }

      const { id, httpAgent, ip } = await this.jwtService.verify<{
        id: string;
        httpAgent: string;
        ip: string;
      }>(token, {
        secret: process.env.JWT_SECRET,
      });

      if (!id || !httpAgent || !ip) {
        throw new BadRequestException();
      }

      const isCompromented = httpAgent !== userAgent || ip !== ipAddress;

      if (isCompromented) {
        throw new BadRequestException();
      }

      return {};
    } catch (err) {}
  }
}
