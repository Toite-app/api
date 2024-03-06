import { BadRequestException as Exception } from "@nestjs/common";

import { ErrorInstance, ErrorMessage } from "../index.types";

/**
 * Bad request exception which is thrown if any parameters of request is not valid
 * @see [Exception filters - NestJS](https://docs.nestjs.com/exception-filters)
 */
export class BadRequestException extends Exception {
  constructor(message?: ErrorMessage) {
    super({
      errorCode: "BAD_REQUEST",
      message: message || "Bad request",
    } as ErrorInstance);
  }
}
