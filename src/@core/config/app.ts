import * as cookieParser from "cookie-parser";
import { INestApplication } from "@nestjs/common";

export const configApp = (app: INestApplication) => {
  // Parse cookies
  app.use(cookieParser());

  // Enable CORS
  app.enableCors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
    allowedHeaders: ["Accept", "Content-Type", "Authorization"],
  });
};
