import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import * as requestIp from "@supercharge/request-ip";
import { Request } from "express";

const IpAddress = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return String(requestIp.getClientIp(request));
  },
);

export default IpAddress;
