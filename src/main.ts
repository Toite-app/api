import { patchNestJsSwagger } from "nestjs-zod";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle("Toite API")
    .setDescription("The API part of the Toite project")
    .setVersion("1.0.0 (just started)")
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

patchNestJsSwagger();
bootstrap();
