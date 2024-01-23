import { NotFoundException as Exception } from "@nestjs/common";

/**
 * Not found exception which is thrown if called data doesn't exist in database
 * @see [Exception filters - NestJS](https://docs.nestjs.com/exception-filters)
 */
export class NotFoundException extends Exception {}
