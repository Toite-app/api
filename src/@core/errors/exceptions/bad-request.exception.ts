import { BadRequestException as Exception } from "@nestjs/common";

/**
 * Bad request exception which is thrown if any parameters of request is not valid
 * @see [Exception filters - NestJS](https://docs.nestjs.com/exception-filters)
 */
export class BadRequestException extends Exception {}
