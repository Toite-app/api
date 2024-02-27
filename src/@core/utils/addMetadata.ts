import { DECORATORS } from "@nestjs/swagger/dist/constants";

export const addMetadata =
  (metadata: any) => (target: object, propertyKey: string) => {
    const existingMetadata = Reflect.getMetadata(
      DECORATORS.API_PARAMETERS,
      target[propertyKey],
    );

    Reflect.defineMetadata(
      DECORATORS.API_PARAMETERS,
      [...(existingMetadata || []).flatMap((arr) => arr), metadata],
      target[propertyKey],
    );
  };
