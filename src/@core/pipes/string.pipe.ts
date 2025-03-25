import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { ArgumentMetadata, PipeTransform } from "@nestjs/common";

export type StringValuePipeOptions = {
  allowedValues?: string[];
};

export class StringValuePipe implements PipeTransform {
  constructor(private readonly options?: StringValuePipeOptions) {}

  transform(value: string, metadata: ArgumentMetadata): string | null {
    if (!value) return null;

    if (
      typeof value === "string" &&
      (value === "undefined" || value === "null")
    ) {
      return null;
    }

    if (this.options?.allowedValues) {
      const lowerCased = value.toLowerCase();
      const lowerCasedAllowedValues = this.options.allowedValues.map((value) =>
        value.toLowerCase(),
      );

      if (!lowerCasedAllowedValues.includes(lowerCased)) {
        throw new BadRequestException(
          "errors.string-value-pipe.invalid-value",
          {
            property: metadata.data,
          },
        );
      }
    }

    return value ?? null;
  }
}
