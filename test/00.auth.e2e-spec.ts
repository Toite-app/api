import * as request from "supertest";
import { HttpStatus, INestApplication } from "@nestjs/common";
import { getTestApp } from "./helpers/app";
import { ConfigService } from "@nestjs/config";
import { migrate } from "./helpers/migrate-db";
import { createAdmin } from "./helpers/create-admin";
import { TEST_USER_AGENT } from "./helpers/consts";
import { AUTH_COOKIES } from "src/auth/auth.types";
import { delay } from "./helpers/delay";
import * as ms from "@lukeed/ms";
import { clearDatabase } from "./helpers/clear-db";

describe("Auth Controller (e2e)", () => {
  let app: INestApplication;
  let adminPassword: string;
  let cookie: string = "";

  beforeAll(async () => {
    await clearDatabase();
    await migrate();
    await createAdmin();
    app = await getTestApp();

    await app.init();

    const configService = app.get(ConfigService);

    adminPassword = configService.get("INITIAL_ADMIN_PASSWORD");
  });

  afterAll(async () => {
    await app.close();
  });

  it("/auth/sign-in (POST) - should return 401 Unauthorized", async () => {
    await request(app.getHttpServer())
      .post("/auth/sign-in")
      .send({
        login: "admin",
        password: "wrong-password",
      })
      .then((response) => {
        expect(response.body.message).toBe("Wrong password");
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });
  });

  it("/auth/user (GET) - should return 401 Unauthorized", async () => {
    await request(app.getHttpServer())
      .get("/auth/user")
      .set("user-agent", TEST_USER_AGENT)
      .then((response) => {
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });
  });

  it("/auth/sign-in (POST) - should return 200 OK", async () => {
    await request(app.getHttpServer())
      .post("/auth/sign-in")
      .set("user-agent", TEST_USER_AGENT)
      .send({
        login: "admin",
        password: adminPassword,
      })
      .then((response) => {
        cookie = response.headers["set-cookie"][0];

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.headers["set-cookie"]).toBeDefined();
        expect(response.body).toBeDefined();
        expect(response.body.id).toBeDefined();
        expect(response.body.login).toBeDefined();
        expect(cookie).toContain(`${AUTH_COOKIES.token}=`);
      });
  });

  it("/auth/user (GET) - should return 200 OK", async () => {
    await request(app.getHttpServer())
      .get("/auth/user")
      .set("user-agent", TEST_USER_AGENT)
      .set("Cookie", cookie)
      .then((response) => {
        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body).toBeDefined();
        expect(response.body.id).toBeDefined();
        expect(response.body.login).toBeDefined();
      });
  });

  it("[COMPROMATED] /auth/user (GET) - should return 401 Unauthorized", async () => {
    await request(app.getHttpServer())
      .get("/auth/user")
      .set("user-agent", "compromated")
      .set("Cookie", cookie)
      .then((response) => {
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });
  });

  it("/auth/user (GET) - should refresh session", async () => {
    let newCookie: string = "";

    await delay(ms.parse(process.env.SESSION_EXPIRES_IN));

    await request(app.getHttpServer())
      .get("/auth/user")
      .set("user-agent", TEST_USER_AGENT)
      .set("Cookie", cookie)
      .then((response) => {
        console.log(response.headers);
        expect(response.status).toBe(HttpStatus.OK);
        expect(response.headers["set-cookie"]).toBeDefined();

        newCookie = response.headers["set-cookie"][0];
      });

    expect(newCookie).not.toBe(cookie);

    await request(app.getHttpServer())
      .get("/auth/user")
      .set("user-agent", TEST_USER_AGENT)
      .set("Cookie", cookie)
      .then((response) => {
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });

    cookie = newCookie;
  });

  it("/auth/sign-out (DELETE) - should return 200 OK", async () => {
    await request(app.getHttpServer())
      .delete("/auth/sign-out")
      .set("user-agent", TEST_USER_AGENT)
      .set("Cookie", cookie)
      .then((response) => {
        expect(response.status).toBe(HttpStatus.OK);
        expect(response.headers["set-cookie"]).toBeDefined();
      });
  });

  it("/auth/user (GET) - should return 401 Unauthorized (after sign-out)", async () => {
    await request(app.getHttpServer())
      .get("/auth/user")
      .set("user-agent", TEST_USER_AGENT)
      .set("Cookie", cookie)
      .then((response) => {
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });
  });
});
