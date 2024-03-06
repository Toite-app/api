import { BadRequestException as Exception } from "@nestjs/common";

import { ErrorInstance, ErrorMessage } from "../index.types";

export type FormExceptionDetail = {
  property: string;
  constraints?: Record<string, string>;
  message: string;
};

export class FormException extends Exception {
  constructor(message?: ErrorMessage<FormExceptionDetail[]>) {
    super({
      errorCode: "FORM",
      message: message || "Some fields are not valid",
    } as ErrorInstance<FormExceptionDetail[]>);
  }
}
