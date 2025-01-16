import { BadRequestException as Exception } from "@nestjs/common";

import { ErrorInstance, ErrorOptions } from "../index.types";

/**
 * Bad request exception which is thrown if any parameters of request is not valid
 * @see [Exception filters - NestJS](https://docs.nestjs.com/exception-filters)
 */
export class BadRequestException extends Exception {
  constructor(message?: string, options?: ErrorOptions) {
    super({
      errorCode: "BAD_REQUEST",
      message,
      options,
    } as ErrorInstance);
  }
}
