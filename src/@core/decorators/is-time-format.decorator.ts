import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from "class-validator";

export function IsTimeFormat(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isTimeFormat",
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: "Time must be in HH:MM format (24-hour)",
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          if (typeof value !== "string") return false;
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be in HH:MM format (24-hour)`;
        },
      },
    });
  };
}
