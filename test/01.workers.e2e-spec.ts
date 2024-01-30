import * as request from "supertest";
import { HttpStatus, INestApplication } from "@nestjs/common";
import { clearDatabase } from "./helpers/clear-db";
import { createAdmin } from "./helpers/create-admin";
import { getTestApp } from "./helpers/app";
import { signIn } from "./helpers/sign-in";
import { AUTH_COOKIES } from "src/auth/auth.types";
import { seedDatabase } from "./helpers/seed";

import { TEST_PASSWORD, TEST_USER_AGENT } from "./helpers/consts";
import { createRoleWorker } from "./helpers/create-role-worker";

describe("Workers Controller (e2e)", () => {
  let app: INestApplication;
  let sysAdminToken: string;
  let adminToken: string;
  let dispatcherToken: string;

  beforeAll(async () => {
    await clearDatabase();
    await createAdmin();
    await seedDatabase();

    app = await getTestApp();
    await app.init();

    sysAdminToken = `${AUTH_COOKIES.token}=${await signIn("admin", app)}`;

    const dispatcherLogin = await createRoleWorker("DISPATCHER");
    const adminLogin = await createRoleWorker("ADMIN");

    adminToken = `${AUTH_COOKIES.token}=${await signIn(adminLogin, app)}`;

    dispatcherToken = `${AUTH_COOKIES.token}=${await signIn(
      dispatcherLogin,
      app,
    )}`;
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
      .set("Cookie", [sysAdminToken])
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
      .set("Cookie", [sysAdminToken])
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

  it("/workers (POST) - should return 401 Unauthorized", async () => {
    await request(app.getHttpServer())
      .post("/workers")
      .then((response) => {
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });

    await request(app.getHttpServer())
      .post("/workers")
      .set("Cookie", [dispatcherToken])
      .set("user-agent", TEST_USER_AGENT)
      .then((response) => {
        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      });

    await request(app.getHttpServer())
      .post("/workers")
      .set("Cookie", [sysAdminToken])
      .set("user-agent", TEST_USER_AGENT)
      .then((response) => {
        expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      });
  });

  it("/workers (POST) - should return 403 Forbidden (admin tries create chief admin)", async () => {
    await request(app.getHttpServer())
      .post("/workers")
      .set("Cookie", adminToken)
      .set("user-agent", TEST_USER_AGENT)
      .send({
        login: "chiefadmin",
        password: TEST_PASSWORD,
        role: "CHIEF_ADMIN",
      })
      .then((response) => {
        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      });
  });

  it("/workers (POST) - should return week password error", async () => {
    await request(app.getHttpServer())
      .post("/workers")
      .set("Cookie", [sysAdminToken])
      .set("user-agent", TEST_USER_AGENT)
      .send({
        login: "testdispatcher",
        password: "123",
        role: "DISPATCHER",
      })
      .then((response) => {
        expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        expect(response.body.message).toContain("password");
      });
  });

  let dispatcherId: number = 0;

  it("/workers (POST) - should return 201 Created", async () => {
    await request(app.getHttpServer())
      .post("/workers")
      .set("Cookie", [sysAdminToken])
      .set("user-agent", TEST_USER_AGENT)
      .send({
        login: "testdispatcher",
        password: TEST_PASSWORD,
        role: "DISPATCHER",
      })
      .then((response) => {
        expect(response.status).toBe(HttpStatus.CREATED);
      });

    // try to login
    await request(app.getHttpServer())
      .post("/auth/sign-in")
      .set("user-agent", TEST_USER_AGENT)
      .send({
        login: "testdispatcher",
        password: TEST_PASSWORD,
      })
      .then((response) => {
        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body).toBeDefined();
        expect(response.body.id).toBeDefined();
        expect(response.body.login).toBeDefined();
        expect(response.body.role).toBeDefined();
        expect(response.body.login).toEqual("testdispatcher");
        expect(response.body.role).toEqual("DISPATCHER");
        dispatcherId = response.body.id;
      });
  });

  it("/workers/:id (GET) - should return 401 Unauthorized", async () => {
    await request(app.getHttpServer())
      .get(`/workers/${dispatcherId}`)
      .then((response) => {
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });
  });

  it("/workers/:id (GET) - should return 404 Not found", async () => {
    await request(app.getHttpServer())
      .get(`/workers/999999`)
      .set("Cookie", [sysAdminToken])
      .set("user-agent", TEST_USER_AGENT)
      .then((response) => {
        expect(response.status).toBe(HttpStatus.NOT_FOUND);
      });
  });

  it("/workers/:id (GET) - shoult return 200 OK", async () => {
    await request(app.getHttpServer())
      .get(`/workers/${dispatcherId}`)
      .set("Cookie", [sysAdminToken])
      .set("user-agent", TEST_USER_AGENT)
      .then((response) => {
        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body).toBeDefined();
        expect(response.body.login).toBeDefined();
        expect(response.body.role).toBeDefined();
        expect(response.body.login).toEqual("testdispatcher");
        expect(response.body.role).toEqual("DISPATCHER");
      });
  });

  it("/workers (POST) - should return 409 Conflict", async () => {
    await request(app.getHttpServer())
      .post("/workers")
      .set("user-agent", TEST_USER_AGENT)
      .set("Cookie", [sysAdminToken])
      .send({
        login: "testdispatcher",
        password: TEST_PASSWORD,
        role: "DISPATCHER",
      })
      .then((response) => {
        expect(response.status).toBe(HttpStatus.CONFLICT);
      });
  });

  it("/workers (GET) - should have new workers", async () => {
    await request(app.getHttpServer())
      .get("/workers")
      .set("Cookie", [sysAdminToken])
      .set("user-agent", TEST_USER_AGENT)
      .then((response) => {
        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.data).toBeDefined();
        expect(response.body.meta).toBeDefined();
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data.length).toEqual(response.body.meta.size);
        expect(response.body.data.some((w) => w.login === "testdispatcher"));
      });
  });
});
