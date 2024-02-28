import { NotFoundException as Exception } from "@nestjs/common";
import { ErrorInstance, ErrorMessage } from "../index.types";

/**
 * Not found exception which is thrown if called data doesn't exist in database
 * @see [Exception filters - NestJS](https://docs.nestjs.com/exception-filters)
 */
export class NotFoundException extends Exception {
  constructor(message?: ErrorMessage) {
    super({
      errorCode: "NOT_FOUND",
      message: message || "Not found",
    } as ErrorInstance);
  }
}
