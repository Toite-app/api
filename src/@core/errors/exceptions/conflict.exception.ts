import { ConflictException as Exception } from "@nestjs/common";

import { ErrorInstance, ErrorMessage } from "../index.types";

/**
 * Conflict exception which is thrown if provided data conflict with actual entries in database
 * @see [Exception filters - NestJS](https://docs.nestjs.com/exception-filters)
 */
export class ConflictException extends Exception {
  constructor(message?: ErrorMessage) {
    super({
      errorCode: "CONFLICT",
      message: message || "Conflict",
    } as ErrorInstance);
  }
}
