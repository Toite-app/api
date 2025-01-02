import { configApp } from "@core/config/app";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { workers } from "@postgress-db/schema";
import { hash } from "argon2";
import { drizzle } from "drizzle-orm/node-postgres";
import { patchNestJsSwagger } from "nestjs-zod";
import { Pool } from "pg";
import * as schema from "src/drizzle/schema";

import { AppModule } from "./app.module";
import { AUTH_COOKIES } from "./auth/auth.types";

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

  await app.listen(process.env?.PORT ?? 6701);
}

createUserIfDbEmpty();
patchNestJsSwagger();
bootstrap();
