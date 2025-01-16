import { BadRequestException as Exception } from "@nestjs/common";

import { ErrorInstance, ErrorOptions } from "../index.types";

export type FormExceptionDetail = {
  property: string;
  constraints?: Record<string, string>;
  message: string;
};

export class FormException extends Exception {
  constructor(message?: string, options?: ErrorOptions) {
    super({
      errorCode: "FORM",
      message,
      options,
    } as ErrorInstance);
  }
}
