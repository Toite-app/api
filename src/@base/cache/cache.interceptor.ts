import { Request } from "@core/interfaces/request";
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, tap } from "rxjs";
import { CACHE_REQUEST_KEY } from "src/@base/cache/cache.decorator";
import { CacheService } from "src/@base/cache/cache.service";
import { RedisUtils } from "src/@base/redis/redis.utils";

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: CacheService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const controllerClassName = context.getClass().name;
    const handlerName = context.getHandler().name;

    const options = this.reflector.get(CACHE_REQUEST_KEY, context.getHandler());

    if (!options) {
      return next.handle();
    }

    if (request.method !== "GET") {
      this.logger.warn(
        `${controllerClassName}#${handlerName} is not GET request for caching`,
      );

      return next.handle();
    }

    const { ttl = 300 } = options; // Default TTL 5 minutes
    const { query, params, worker, method } = request;

    if (!worker) {
      // We do not cache requests without worker
      return next.handle();
    }

    const cacheKey = RedisUtils.buildKey([
      controllerClassName.trim(),
      handlerName.trim(),
      worker.id.trim(),
      JSON.stringify({
        workerRole: worker.role,
        method,
        query,
        params,
      }),
    ]);

    try {
      const cachedData = await this.cacheService.get(cacheKey);
      if (cachedData) {
        return new Observable((subscriber) => {
          subscriber.next(
            typeof cachedData === "string"
              ? cachedData
              : JSON.parse(cachedData as unknown as string),
          );
          subscriber.complete();
        });
      }

      return next.handle().pipe(
        tap(async (data) => {
          try {
            await this.cacheService.setex(cacheKey, data, ttl);
          } catch (error) {
            this.logger.error(
              `Failed to cache data for key ${cacheKey}:`,
              error,
            );
          }
        }),
      );
    } catch (error) {
      this.logger.error(
        `Error in cache interceptor for key ${cacheKey}:`,
        error,
      );
      return next.handle();
    }
  }
}
