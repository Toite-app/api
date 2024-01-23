import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import {
  plainToInstance,
  ClassTransformOptions,
  ClassConstructor,
} from "class-transformer";

/**
 * Serialization interceptor transforms response by filtering only exposed properties
 * @see [Interceptors - NestJS](https://docs.nestjs.com/interceptors)
 */
@Injectable()
export class SerializationInterceptor implements NestInterceptor {
  constructor(
    /**
     * Constructor of class to which the target object must satisfy
     */
    private readonly entity: ClassConstructor<unknown>,
  ) {}

  /**
   * Parameters of transformation
   */
  private readonly options: ClassTransformOptions = {
    excludeExtraneousValues: true,
  };

  /**
   * Implements interception logic
   * @param context Execution context which describes current request pipeline
   * @param next Object which provides access to response RxJS stream
   */
  public intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (!data || typeof data !== "object") {
          return data;
        }

        return plainToInstance(this.entity, data, this.options);
      }),
    );
  }
}
