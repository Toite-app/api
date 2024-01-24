import { configApp } from "@core/config/app";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "src/app.module";

export const getTestApp = async (): Promise<INestApplication> => {
  const testModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = testModule.createNestApplication();

  configApp(app);

  return app;
};
