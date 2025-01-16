import { NotFoundException as Exception } from "@nestjs/common";

import { ErrorInstance, ErrorOptions } from "../index.types";

/**
 * Not found exception which is thrown if called data doesn't exist in database
 * @see [Exception filters - NestJS](https://docs.nestjs.com/exception-filters)
 */
export class NotFoundException extends Exception {
  constructor(message?: string, options?: ErrorOptions) {
    super({
      errorCode: "NOT_FOUND",
      message,
      options,
    } as ErrorInstance);
  }
}
