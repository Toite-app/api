import { Request } from "@core/interfaces/request";
import { createParamDecorator, ExecutionContext } from "@nestjs/common";

/**
 * Parameter decorator which provides worker object from request
 * @see [Param decorators - NestJS](https://docs.nestjs.com/custom-decorators#param-decorators)
 */
export const Worker = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest() as Request;

    return request.worker;
  },
);
