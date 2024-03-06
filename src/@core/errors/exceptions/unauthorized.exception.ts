import { UnauthorizedException as Exception } from "@nestjs/common";

import { ErrorInstance, ErrorMessage } from "../index.types";

/**
 * Unauthorized exception which is thrown on wrong credentials in login request
 * @see [Exception filters - NestJS](https://docs.nestjs.com/exception-filters)
 */
export class UnauthorizedException extends Exception {
  constructor(message?: ErrorMessage) {
    super({
      errorCode: "UNAUTHORIZED",
      message: message || "Unauthorized",
    } as ErrorInstance);
  }
}
