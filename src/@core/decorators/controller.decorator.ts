import {
  Controller as BaseController,
  applyDecorators,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from "@nestjs/swagger";
import { ThrottlerGuard } from "@nestjs/throttler";
import { errorsDescriptions } from "@core/enums/errors-descriptions.enum";
import { ValidationPipe } from "@core/pipes/validation.pipe";
import { NoOmitValidationPipe } from "@core/pipes/no-omit-validation.pipe";

/**
 * Interface of controller options
 */
interface IControllerOptions {
  /**
   * If it's false, fields which aren't marked with expose decorator will be omited
   * @default false
   */
  noOmit?: boolean;
  tags?: string[];
}

/**
 * Class decorator which encapsulates common controllers decorators
 * @see [Decorator composition - NestJS](https://docs.nestjs.com/custom-decorators#decorator-composition)
 * @param path Basic path of API controller
 */
export function Controller(
  path: string,
  { noOmit, tags }: IControllerOptions = { noOmit: false },
) {
  const Validator = noOmit ? NoOmitValidationPipe : ValidationPipe;

  return applyDecorators(
    BaseController({
      path,
    }),
    UsePipes(Validator),
    UseGuards(ThrottlerGuard),
    ApiTags(...(!tags ? [path] : tags)),
    ApiBadRequestResponse({
      description: errorsDescriptions.badRequest,
    }),
    ApiInternalServerErrorResponse({
      description: errorsDescriptions.serverErr,
    }),
  );
}
