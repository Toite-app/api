import * as request from "supertest";
import { HttpStatus, INestApplication } from "@nestjs/common";
import { clearDatabase } from "./helpers/clear-db";
import { createAdmin } from "./helpers/create-admin";
import { getTestApp } from "./helpers/app";
import { signIn } from "./helpers/sign-in";
import { AUTH_COOKIES } from "src/auth/auth.types";
import { seedDatabase } from "./helpers/seed";

import { TEST_USER_AGENT } from "./helpers/consts";

describe("Workers Controller (e2e)", () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    await clearDatabase();
    await createAdmin();
    await seedDatabase();

    app = await getTestApp();
    await app.init();

    adminToken = `${AUTH_COOKIES.token}=${await signIn("admin", app)}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it("/workers (GET) - should return 401 Unauthorized", async () => {
    await request(app.getHttpServer())
      .get("/workers")
      .then((response) => {
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });
  });

  it("/workers (GET) - should return 200 OK", async () => {
    await request(app.getHttpServer())
      .get("/workers")
      .set("Cookie", [adminToken])
      .set("user-agent", TEST_USER_AGENT)
      .then((response) => {
        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.data).toBeDefined();
        expect(response.body.meta).toBeDefined();
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data.length).toEqual(response.body.meta.size);
      });
  });

  it("/workers (GET) - should return 200 OK (paginated)", async () => {
    await request(app.getHttpServer())
      .get("/workers")
      .set("Cookie", [adminToken])
      .set("user-agent", TEST_USER_AGENT)
      .query({
        page: 2,
        size: 5,
      })
      .then((response) => {
        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.data).toBeDefined();
        expect(response.body.meta).toBeDefined();
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data.length).toEqual(response.body.meta.size);
      });
  });
});
