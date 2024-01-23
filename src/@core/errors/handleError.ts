import { BadRequestException } from "./exceptions/bad-request.exception";
import { ConflictException } from "./exceptions/conflict.exception";
import { ForbiddenException } from "./exceptions/forbidden.exception";
import { NotFoundException } from "./exceptions/not-found.exception";
import { ServerErrorException } from "./exceptions/server-error.exception";
import { UnauthorizedException } from "./exceptions/unauthorized.exception";

/**
 * Handles error and returns error without any changes,
 * if passed error is custom exception, otherwise returns server
 * error exception
 * @see List of custom exceptions:
 * * Bad request exception ({@link core/errors/exceptions/bad-request.exception!BadRequestException})
 * * Unauthorized exception ({@link core/errors/exceptions/unauthorized.exception!UnauthorizedException})
 * * Forbidden exception ({@link core/errors/exceptions/forbidden.exception!ForbiddenException})
 * * Not found exception ({@link core/errors/exceptions/not-found.exception!NotFoundException})
 * * Conflict exception ({@link core/errors/exceptions/conflict.exception!ConflictException})
 * * Server error exception ({@link core/errors/exceptions/server-error.exception!ServerErrorException})
 * @param e Error which is need to be handled
 * @returns Error
 */
export function handleError(e: unknown) {
  const isCustomErr =
    e instanceof BadRequestException ||
    e instanceof ConflictException ||
    e instanceof ForbiddenException ||
    e instanceof NotFoundException ||
    e instanceof UnauthorizedException ||
    e instanceof ServerErrorException;

  if (isCustomErr) {
    return e;
  }

  return new ServerErrorException();
}
