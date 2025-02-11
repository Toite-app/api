import { Controller } from "@core/decorators/controller.decorator";
import { Cookies } from "@core/decorators/cookies.decorator";
import IpAddress from "@core/decorators/ip-address.decorator";
import UserAgent from "@core/decorators/user-agent.decorator";
import { Worker } from "@core/decorators/worker.decorator";
import env from "@core/env";
import { Response } from "@core/interfaces/response";
import {
  Body,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from "@nestjs/common";
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { IWorker } from "@postgress-db/schema/workers";
import { EnableAuditLog } from "src/@base/audit-logs/decorators/audit-logs.decorator";
import { Serializable } from "src/@core/decorators/serializable.decorator";
import { WorkerEntity } from "src/workers/entities/worker.entity";

import { AUTH_COOKIES } from "../auth.types";
import { Public } from "../decorators/public.decorator";
import { SignInDto } from "../dto/req/sign-in.dto";
import { AuthService } from "../services/auth.service";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get("user")
  @HttpCode(HttpStatus.OK)
  @Serializable(WorkerEntity)
  @ApiOperation({
    summary: "Gets a user that signed in system",
  })
  @ApiOkResponse({
    description: "User has been successfully found",
    type: WorkerEntity,
  })
  @ApiUnauthorizedResponse({
    description: "You unauthorized",
  })
  async getUser(@Worker() worker: IWorker) {
    return worker;
  }

  @Public()
  @EnableAuditLog()
  @Post("sign-in")
  @HttpCode(HttpStatus.OK)
  @Serializable(WorkerEntity)
  @ApiOperation({
    summary: "Sign in user and create session",
  })
  @ApiOkResponse({
    description: "User has been successfully signed in",
    type: WorkerEntity,
  })
  @ApiForbiddenResponse({
    description: "Wrong password",
  })
  async signIn(
    @Body() dto: SignInDto,
    @IpAddress() ip: string,
    @UserAgent() httpAgent: string,
    @Res({ passthrough: true })
    res: Response,
  ) {
    const worker = await this.authService.signIn(dto);
    if (!ip) ip = "N/A";

    const signedJWT = await this.authService.createSignedSession({
      httpAgent,
      ip,
      worker,
    });

    res.cookie(AUTH_COOKIES.token, signedJWT, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return {
      ...worker,
    };
  }

  @Delete("sign-out")
  @HttpCode(HttpStatus.OK)
  @Serializable(class Empty {})
  @ApiOperation({
    summary: "Sign out user and destroy session",
  })
  @ApiOkResponse({
    description: "User has been successfully signed out",
  })
  @ApiUnauthorizedResponse({
    description: "You unauthorized",
  })
  async signOut(@Cookies(AUTH_COOKIES.token) token: string) {
    token;
    // await this.authService.destroySession(token);

    return {
      setSessionToken: null,
    };
  }
}
