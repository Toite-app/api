import { ForbiddenException as Exception } from "@nestjs/common";

/**
 * Forbidden exception which is thrown if user are not allow to access the data
 * @see [Exception filters - NestJS](https://docs.nestjs.com/exception-filters)
 */
export class ForbiddenException extends Exception {}
