import env from "@core/env";
import { HttpExceptionFilter } from "@core/errors/http-exception-filter";
import fastifyCookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { I18nValidationPipe } from "nestjs-i18n";

export const configApp = async (app: NestFastifyApplication) => {
  // Parse cookies
  await app.register(fastifyCookie, {
    secret: env.COOKIES_SECRET,
  });

  await app.register(multipart, {
    limits: {
      fileSize: 1024 * 1024 * 8, // 8MB
    },
  });

  app.useGlobalPipes(
    new I18nValidationPipe({
      transform: true,
    }),
  );

  // app.useGlobalFilters(new I18nValidationExceptionFilter());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Enable CORS
  app.enableCors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3035",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3035",
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
    allowedHeaders: ["Accept", "Content-Type", "Authorization"],
  });
};
