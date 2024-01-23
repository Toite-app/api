import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { AbstractStrategy, PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifiedCallback } from "passport-jwt";
import { AUTH_COOKIES, AUTH_STRATEGY } from "../auth.types";
import { AuthService } from "../services/auth.service";
import { Request } from "src/@core/interfaces/request";

@Injectable()
export class RefreshTokenStrategy
  extends PassportStrategy(Strategy, AUTH_STRATEGY.refreshToken)
  implements AbstractStrategy
{
  constructor(
    @Inject(AuthService)
    private readonly authService: AuthService,
  ) {
    const validate = async (req: Request, done: VerifiedCallback) => {
      return await this.validate(req, done);
    };

    super(validate);
  }

  public async validate(req: Request, done: VerifiedCallback) {
    try {
      const { headers, ip, cookies } = req;

      const httpAgent = headers["user-agent"];
      const header = headers?.[AUTH_COOKIES.refreshToken];
      const cookie = cookies?.[AUTH_COOKIES.refreshToken];
      const token = header ?? cookie;

      if (!token) {
        throw new ForbiddenException("Refresh token not found");
      }

      await this.authService.verifyRefreshToken(token, ip, httpAgent);
    } catch (err) {
      done(err);
    }
  }
}
