import { applyDecorators, UseInterceptors } from "@nestjs/common";

import { SetCookiesInterceptor } from "../interceptors/set-cookie.interceptor";

/**
 * Decorator which encapsulates setting cookies decorators
 * @see [Decorator composition - NestJS](https://docs.nestjs.com/custom-decorators#decorator-composition)
 */
export function SetCookies() {
  return applyDecorators(UseInterceptors(SetCookiesInterceptor));
}
