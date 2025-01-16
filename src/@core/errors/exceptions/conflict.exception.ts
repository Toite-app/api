import { ConflictException as Exception } from "@nestjs/common";

import { ErrorInstance, ErrorOptions } from "../index.types";

/**
 * Conflict exception which is thrown if provided data conflict with actual entries in database
 * @see [Exception filters - NestJS](https://docs.nestjs.com/exception-filters)
 */
export class ConflictException extends Exception {
  constructor(message?: string, options?: ErrorOptions) {
    super({
      errorCode: "CONFLICT",
      message,
      options,
    } as ErrorInstance);
  }
}
