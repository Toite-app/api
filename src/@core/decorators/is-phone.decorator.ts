import { registerDecorator, ValidationOptions } from "@i18n-class-validator";
import { isValidPhoneNumber } from "libphonenumber-js";
import { I18nContext } from "nestjs-i18n";

export function IsPhoneNumber(
  validationOptions?: ValidationOptions & {
    isOptional?: boolean;
  },
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isPhoneNumber",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (
            validationOptions?.isOptional &&
            (value === undefined || value === null || value === "")
          ) {
            return true;
          }

          return typeof value === "string" && isValidPhoneNumber(value);
        },
        defaultMessage() {
          const i18n = I18nContext.current();
          const errorText = i18n?.t("validation.validators.isPhoneNumber");

          return `${errorText}`;
        },
      },
    });
  };
}
