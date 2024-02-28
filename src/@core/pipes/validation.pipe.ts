/* eslint-disable @typescript-eslint/ban-types */
import { PipeTransform, Injectable, ArgumentMetadata } from "@nestjs/common";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";
import { handleError } from "@core/errors/handleError";
import { BadRequestException } from "../errors/exceptions/bad-request.exception";
import { FormException } from "@core/errors/exceptions/form.exception";

/**
 * Validates input data by class validator decorators
 * @see [Validation pipes - NestJS](https://docs.nestjs.com/pipes#class-validator)
 */
@Injectable()
export class ValidationPipe implements PipeTransform {
  /**
   * Checks if a metatype is not base JS type
   * @param metatype Metatype which is need to be checked
   */
  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  /**
   * Implements validation logic
   * @param value Value which need to validate
   * @param metadata Metadata of validating value
   * * {@link core/errors/exceptions/bad-request.exception!BadRequestException}
   * if input data is not valid
   */
  public async transform(value: unknown, { metatype }: ArgumentMetadata) {
    try {
      if (typeof value === "string" && metatype === Date) {
        return new Date(value);
      }

      if (metatype === String) return String(value);

      if (typeof value !== "object" && metatype === Object) {
        throw new BadRequestException({
          title: "Body error",
          description: "Body should be an object",
        });
      }

      if (!metatype || !this.toValidate(metatype)) {
        return value;
      }

      const object = plainToClass(metatype, value, {
        excludeExtraneousValues: true,
      });

      const errors = await validate(object, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      if (errors.length > 0) {
        const messages = errors.map(({ constraints }) => {
          const [key] = Object.keys(constraints);
          return `${constraints[key]}`;
        });

        throw new FormException({
          title: "Validation error",
          description: messages.join(", "),
          details: errors.map(({ property, constraints }) => ({
            property,
            message: messages.join("; "),
            constraints,
          })),
        });
      }

      return object;
    } catch (e) {
      throw handleError(e);
    }
  }
}
