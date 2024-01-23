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
import { AuthService } from "../services/auth.service";
import { Serializable } from "src/@core/decorators/serializable.decorator";
import { WorkerEntity } from "src/workers/entities/worker.entity";
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from "@nestjs/swagger";
import { SignInDto } from "../dto/req/sign-in.dto";
import { AccessTokenResponse } from "../entities/access-token.entity";
import { IncomingHttpHeaders } from "http2";
import { Controller } from "@core/decorators/controller.decorator";
import { SetCookies } from "../decorators/set-cookie.decorator";

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
  @ApiNotFoundResponse({
    description: "User not found (you unauthorized)",
  })
  async getUser() {
    return "This action returns user";
  }

  @Post("sign-in")
  @SetCookies()
  @HttpCode(HttpStatus.OK)
  @Serializable(AccessTokenResponse)
  @ApiOperation({
    summary: "Sign in user and create session",
  })
  @ApiOkResponse({
    description: "User has been successfully signed in",
    type: AccessTokenResponse,
  })
  @ApiNotFoundResponse({
    description: "User not found",
  })
  @ApiForbiddenResponse({
    description: "Wrong password",
  })
  async signIn(
    @Body() dto: SignInDto,
    @Ip() ip: string,
    @Headers() headers: IncomingHttpHeaders,
  ) {
    const httpAgent = (headers?.["user-agent"] ||
      headers?.["User-Agent"] ||
      "N/A") as string;

    if (!ip) ip = "N/A";

    console.log("IP", ip);
    console.log("HTTP_AGENT", httpAgent);

    const worker = await this.authService.signIn(dto);
    const accessToken = await this.authService.getAccessToken(worker);
    const refreshToken = await this.authService.getRefreshToken({
      httpAgent,
      ip,
      worker,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @Serializable(AccessTokenResponse)
  @ApiOperation({
    summary: "Refresh tokens",
  })
  @ApiOkResponse({
    description: "Tokens has been successfully refreshed",
    type: AccessTokenResponse,
  })
  async refreshTokens() {}

  @Delete("sign-out")
  async signOut() {
    return "This action signs out user";
  }
}
