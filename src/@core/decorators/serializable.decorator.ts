import { applyDecorators, UseInterceptors } from "@nestjs/common";
import { ClassConstructor } from "class-transformer";
import { SerializationInterceptor } from "../interceptors/serialization.interceptor";

/**
 * Method decorator which transforms response by filtering only exposed properties
 * @see [Decorator composition - NestJS](https://docs.nestjs.com/custom-decorators#decorator-composition)
 * @param entity Constructor of class to which the method response must satisfy
 */
export function Serializable(entity: ClassConstructor<unknown>) {
  return applyDecorators(UseInterceptors(new SerializationInterceptor(entity)));
}
