import { INestApplication } from "@nestjs/common";
import * as cookieParser from "cookie-parser";

export const configApp = (app: INestApplication) => {
  // Parse cookies
  app.use(cookieParser());

  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     transform: true, // Transform is recomended configuration for avoind issues with arrays of files transformations
  //   }),
  // );

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
