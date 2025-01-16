import { InternalServerErrorException as Exception } from "@nestjs/common";

import { ErrorInstance, ErrorOptions } from "../index.types";

/**
 * Server error exception which is thrown on any internal error
 * which are differ from custom exceptions
 * @see [Exception filters - NestJS](https://docs.nestjs.com/exception-filters)
 */
export class ServerErrorException extends Exception {
  constructor(message?: string, options?: ErrorOptions) {
    super({
      errorCode: "SERVER_ERROR",
      message,
      options,
    } as ErrorInstance);
  }
}
