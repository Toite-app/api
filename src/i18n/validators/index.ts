import { applyDecorators } from "@nestjs/common";
// eslint-disable-next-line no-restricted-imports
import {
  IsArray as _IsArray,
  IsBoolean as _IsBoolean,
  IsDate as _IsDate,
  IsEnum as _IsEnum,
  IsISO8601 as _IsISO8601,
  IsLatitude as _IsLatitude,
  IsNumber as _IsNumber,
  IsOptional as _IsOptional,
  IsString as _IsString,
  IsStrongPassword as _IsStrongPassword,
  IsUUID as _IsUUID,
  MinLength as _MinLength,
  IsNumberOptions,
  ValidationOptions,
} from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

// eslint-disable-next-line no-restricted-imports
export {
  validate,
  registerDecorator,
  ValidationArguments,
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

export const IsString = (validationOptions?: ValidationOptions) =>
  applyDecorators(
    _IsString(mergeI18nValidation("isString", validationOptions)),
  );

export const IsBoolean = (validationOptions?: ValidationOptions) =>
  applyDecorators(
    _IsBoolean(mergeI18nValidation("isBoolean", validationOptions)),
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
