import { ForbiddenException as Exception } from "@nestjs/common";

import { ErrorInstance, ErrorMessage } from "../index.types";

/**
 * Forbidden exception which is thrown if user are not allow to access the data
 * @see [Exception filters - NestJS](https://docs.nestjs.com/exception-filters)
 */
export class ForbiddenException extends Exception {
  constructor(message?: ErrorMessage) {
    super({
      errorCode: "FORBIDDEN",
      message: message || "Forbidden",
    } as ErrorInstance);
  }
}
