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
  @Serializable(WorkerEntity)
  @ApiOperation({
    summary: "Sign in user and create session",
  })
  @ApiOkResponse({
    description: "User has been successfully signed in",
    type: WorkerEntity,
  })
  @ApiNotFoundResponse({
    description: "User not found",
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

    const session = await this.authService.obtainSession({
      headers,
      ipAddress,
      worker,
    });

    return {
      ...worker,
      setSessionToken: session.token,
    };
  }

  @Delete("sign-out")
  async signOut() {
    return "This action signs out user";
  }
}
