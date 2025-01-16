import { HttpExceptionFilter } from "@core/errors/http-exception-filter";
import { INestApplication } from "@nestjs/common";
import * as cookieParser from "cookie-parser";
import { I18nValidationPipe } from "nestjs-i18n";

export const configApp = (app: INestApplication) => {
  // Parse cookies
  app.use(cookieParser());

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
