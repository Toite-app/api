import { Pool } from "pg";
import { patchNestJsSwagger } from "nestjs-zod";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { drizzle } from "drizzle-orm/node-postgres";
import { workers } from "@postgress-db/schema";
import * as schema from "src/drizzle/schema";
import { hash } from "argon2";

import { AUTH_COOKIES } from "./auth/auth.types";
import { configApp } from "@core/config/app";

export const createUserIfDbEmpty = async () => {
  const db = drizzle(
    new Pool({ connectionString: process.env.POSTGRESQL_URL }),
    { schema },
  );

  if ((await db.query.workers.findMany()).length === 0) {
    await db.insert(workers).values({
      login: "admin",
      passwordHash: await hash(process.env.INITIAL_ADMIN_PASSWORD),
      role: schema.ZodWorkerRole.Enum.SYSTEM_ADMIN,
    });
  }
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  configApp(app);

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
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup("docs", app, document, {
    customSiteTitle: "Toite API Docs",
    customfavIcon:
      "https://avatars.githubusercontent.com/u/157302718?s=200&v=4",
    swaggerOptions: {},
  });

  await app.listen(3000);
}

createUserIfDbEmpty();
patchNestJsSwagger();
bootstrap();
