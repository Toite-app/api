import "dotenv/config";
import { configApp } from "@core/config/app";
import env from "@core/env";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { patchNestJsSwagger } from "nestjs-zod";

import { AppModule } from "./app.module";
import { AUTH_COOKIES } from "./auth/auth.types";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await configApp(app);

  // Only setup Swagger in development
  if (env.NODE_ENV !== "production") {
    const config = new DocumentBuilder()
      .setTitle("Toite API")
      .setDescription("The API part of the Toite project")
      .setVersion("1.0.0 (just started)")
      .addCookieAuth(AUTH_COOKIES.token, {
        type: "apiKey",
      })
      .setContact("Yefrosynii", "https://www.yefro.dev/", "contact@yefro.dev")
      .addTag("workers", "Get data about workers and manage them")
      .addTag("auth", "Part of authentification for workers part of the system")
      .addTag("restaurants", "Get data about restaurants and manage them")
      .addTag("guests", "Get data about guests and manage them")
      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup("docs", app, document, {
      customSiteTitle: "Toite API Docs",
      customfavIcon:
        "https://avatars.githubusercontent.com/u/157302718?s=200&v=4",
      swaggerOptions: {},
    });
  }

  await app.listen(env.PORT, "0.0.0.0");
}

// Only patch Swagger in development
if (env.NODE_ENV !== "production") {
  patchNestJsSwagger();
}

bootstrap();
