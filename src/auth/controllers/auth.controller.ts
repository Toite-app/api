import { IncomingHttpHeaders } from "http2";

import { Controller } from "@core/decorators/controller.decorator";
import { Cookies } from "@core/decorators/cookies.decorator";
import { Worker } from "@core/decorators/worker.decorator";
import {
  Body,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
} from "@nestjs/common";
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { IWorker } from "@postgress-db/schema/workers";
import { Serializable } from "src/@core/decorators/serializable.decorator";
import { WorkerEntity } from "src/workers/entities/worker.entity";

import { AUTH_COOKIES } from "../auth.types";
import { RequireSessionAuth } from "../decorators/session-auth.decorator";
import { SetCookies } from "../decorators/set-cookie.decorator";
import { SignInDto } from "../dto/req/sign-in.dto";
import { AuthService } from "../services/auth.service";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @RequireSessionAuth()
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

  @Post("sign-in")
  @SetCookies()
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
    @Ip() ipAddress: string,
    @Headers() headers: IncomingHttpHeaders,
  ) {
    const worker = await this.authService.signIn(dto);
    if (!ipAddress) ipAddress = "N/A";

    const session = await this.authService.createSession({
      headers,
      ipAddress,
      worker,
    });

    return {
      ...worker,
      setSessionToken: session?.token,
    };
  }

  @RequireSessionAuth()
  @SetCookies()
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
    await this.authService.destroySession(token);

    return {
      setSessionToken: null,
    };
  }
}
