import { applyDecorators } from "@nestjs/common";
// eslint-disable-next-line no-restricted-imports
import {
  IsArray as _IsArray,
  IsBoolean as _IsBoolean,
  IsDate as _IsDate,
  IsDecimal as _IsDecimal,
  IsEnum as _IsEnum,
  IsInt as _IsInt,
  IsISO8601 as _IsISO8601,
  IsLatitude as _IsLatitude,
  IsNotEmpty as _IsNotEmpty,
  IsNumber as _IsNumber,
  IsObject as _IsObject,
  IsOptional as _IsOptional,
  IsString as _IsString,
  IsStrongPassword as _IsStrongPassword,
  IsUUID as _IsUUID,
  Max as _Max,
  MaxLength as _MaxLength,
  Min as _Min,
  MinLength as _MinLength,
  IsNumberOptions,
  ValidationOptions,
} from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";
import { DecimalLocale } from "validator";

// eslint-disable-next-line no-restricted-imports
export {
  validate,
  ValidationError,
  registerDecorator,
  ValidationArguments,
  ValidateNested,
} from "class-validator";
export { ValidationOptions };

// Helper function to merge validation options with i18n message
const mergeI18nValidation = (
  key: string,
  validationOptions?: ValidationOptions,
): ValidationOptions => ({
  message: i18nValidationMessage(`validation.validators.${key}`),
  ...validationOptions,
});

export const IsNotEmpty = (validationOptions?: ValidationOptions) =>
  applyDecorators(
    _IsNotEmpty(mergeI18nValidation("isNotEmpty", validationOptions)),
  );

export const IsString = (validationOptions?: ValidationOptions) =>
  applyDecorators(
    _IsString(mergeI18nValidation("isString", validationOptions)),
  );

export const IsBoolean = (validationOptions?: ValidationOptions) =>
  applyDecorators(
    _IsBoolean(mergeI18nValidation("isBoolean", validationOptions)),
  );

export const IsObject = (validationOptions?: ValidationOptions) =>
  applyDecorators(
    _IsObject(mergeI18nValidation("isObject", validationOptions)),
  );

export const IsUUID = (
  version?: "3" | "4" | "5" | "all",
  validationOptions?: ValidationOptions,
) =>
  applyDecorators(
    _IsUUID(version ?? "4", mergeI18nValidation("isUUID", validationOptions)),
  );

export const IsEnum = (entity: object, validationOptions?: ValidationOptions) =>
  applyDecorators(
    _IsEnum(entity, mergeI18nValidation("isEnum", validationOptions)),
  );

export const IsISO8601 = (validationOptions?: ValidationOptions) =>
  applyDecorators(
    _IsISO8601({}, mergeI18nValidation("isDate", validationOptions)),
  );

export const MinLength = (min: number, validationOptions?: ValidationOptions) =>
  applyDecorators(
    _MinLength(min, mergeI18nValidation("minLength", validationOptions)),
  );

export const MaxLength = (max: number, validationOptions?: ValidationOptions) =>
  applyDecorators(
    _MaxLength(max, mergeI18nValidation("maxLength", validationOptions)),
  );

export const IsNumber = (
  options: IsNumberOptions = {},
  validationOptions?: ValidationOptions,
) =>
  applyDecorators(
    _IsNumber(options, mergeI18nValidation("isNumber", validationOptions)),
  );

export const IsArray = (validationOptions?: ValidationOptions) =>
  applyDecorators(_IsArray(mergeI18nValidation("isArray", validationOptions)));

// Re-export IsOptional as is since it doesn't have a message
export const IsOptional = _IsOptional;

export const IsLatitude = (validationOptions?: ValidationOptions) =>
  applyDecorators(
    _IsLatitude(mergeI18nValidation("isLatitude", validationOptions)),
  );

export const IsDate = (validationOptions?: ValidationOptions) =>
  applyDecorators(_IsDate(mergeI18nValidation("isDate", validationOptions)));

export const IsStrongPassword = (
  options = {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 0,
  },
  validationOptions?: ValidationOptions,
) =>
  applyDecorators(
    _IsStrongPassword(
      options,
      mergeI18nValidation("isStrongPassword", validationOptions),
    ),
  );

export const IsInt = (validationOptions?: ValidationOptions) =>
  applyDecorators(_IsInt(mergeI18nValidation("isInt", validationOptions)));

export const IsDecimal = (
  options: {
    /**
     * @default false
     */
    force_decimal?: boolean | undefined;
    /**
     * `decimal_digits` is given as a range like `'1,3'`,
     * a specific value like `'3'` or min like `'1,'`
     *
     * @default '1,'
     */
    decimal_digits?: string | undefined;
    /**
     * DecimalLocale
     *
     * @default 'en-US'
     */
    locale?: DecimalLocale | undefined;
  } = {},
  validationOptions?: ValidationOptions,
) =>
  applyDecorators(
    _IsDecimal(options, mergeI18nValidation("isDecimal", validationOptions)),
  );

export const Min = (min: number, validationOptions?: ValidationOptions) =>
  applyDecorators(_Min(min, mergeI18nValidation("min", validationOptions)));

export const Max = (max: number, validationOptions?: ValidationOptions) =>
  applyDecorators(_Max(max, mergeI18nValidation("max", validationOptions)));
