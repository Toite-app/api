import { createParamDecorator, ExecutionContext } from "@nestjs/common";

/**
 * Parameter decorator which provides cookies object from request
 * @see [Param decorators - NestJS](https://docs.nestjs.com/custom-decorators#param-decorators)
 */
export const Cookies = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? request.cookies?.[data] : request.cookies;
  },
);
