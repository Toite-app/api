import { ConflictException as Exception } from "@nestjs/common";

/**
 * Conflict exception which is thrown if provided data conflict with actual entries in database
 * @see [Exception filters - NestJS](https://docs.nestjs.com/exception-filters)
 */
export class ConflictException extends Exception {}
