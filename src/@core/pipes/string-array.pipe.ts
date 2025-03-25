import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { ArgumentMetadata, PipeTransform } from "@nestjs/common";

export type StringArrayPipeOptions = {
  allowedValues?: string[];
};

export class StringArrayPipe implements PipeTransform {
  constructor(private readonly options?: StringArrayPipeOptions) {}

  transform(value: string, metadata: ArgumentMetadata): string[] | null {
    if (!value) return null;

    if (
      typeof value === "string" &&
      (value === "undefined" || value === "null")
    ) {
      return null;
    }

    const values = value.split(",");

    if (values.length === 0) {
      throw new BadRequestException("errors.string-array-pipe.empty-array", {
        property: metadata.data,
      });
    }

    if (this.options?.allowedValues) {
      const lowerCasedValues = values.map((value) => value.toLowerCase());
      const lowerCasedAllowedValues = this.options.allowedValues.map((value) =>
        value.toLowerCase(),
      );

      for (const value of lowerCasedValues) {
        if (!lowerCasedAllowedValues.includes(value)) {
          throw new BadRequestException(
            "errors.string-value-pipe.invalid-value",
            {
              property: metadata.data,
            },
          );
        }
      }
    }

    return values;
  }
}
