import * as request from "supertest";
import { AUTH_COOKIES } from "src/auth/auth.types";
import { getTestApp } from "./helpers/app";
import { clearDatabase } from "./helpers/clear-db";
import { createAdmin } from "./helpers/create-admin";
import { seedDatabase } from "./helpers/seed";
import { signIn } from "./helpers/sign-in";
import { createRoleWorker } from "./helpers/create-role-worker";
import { HttpStatus, INestApplication } from "@nestjs/common";
import { TEST_USER_AGENT } from "./helpers/consts";
import { CreateRestaurantDto } from "src/restaurants/dto/create-restaurant.dto";

describe("Restaurants Controller (e2e)", () => {
  let app: INestApplication;
  let sysAdminToken: string;
  let adminToken: string;

  beforeAll(async () => {
    await clearDatabase();
    await createAdmin();
    await seedDatabase();

    app = await getTestApp();
    await app.init();

    sysAdminToken = `${AUTH_COOKIES.token}=${await signIn("admin", app)}`;

    const adminLogin = await createRoleWorker("ADMIN");

    adminToken = `${AUTH_COOKIES.token}=${await signIn(adminLogin, app)}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it("/restaurants (GET) - should return 401 Unauthorized", async () => {
    await request(app.getHttpServer())
      .get("/restaurants")
      .then((response) => {
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });
  });

  it("/restaurants (GET) - should return 200 OK", async () => {
    await request(app.getHttpServer())
      .get("/restaurants")
      .set("Cookie", [sysAdminToken])
      .set("user-agent", TEST_USER_AGENT)
      .then((response) => {
        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.data).toBeDefined();
        expect(response.body.meta).toBeDefined();
      });
  });

  it("/restaurants (POST) - should return 401 Unauthorized", async () => {
    await request(app.getHttpServer())
      .post("/restaurants")
      .then((response) => {
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      });
  });

  it("/restaurants (POST) - should return 403 Forbidden", async () => {
    await request(app.getHttpServer())
      .post("/restaurants")
      .set("Cookie", [adminToken])
      .set("user-agent", TEST_USER_AGENT)
      .then((response) => {
        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      });
  });

  const restName = "Test Restaurant";

  it("/restaurants (POST) - should return 201 Created", async () => {
    await request(app.getHttpServer())
      .post("/restaurants")
      .set("Cookie", [sysAdminToken])
      .set("user-agent", TEST_USER_AGENT)
      .send({
        name: restName,
        legalEntity: "PetsHall OÜ (reg. 12345678)",
        address: "Viru väljak, 10111 Tallinn",
        latitude: "59.436962",
        longitude: "24.753574",
        isEnabled: true,
      } as CreateRestaurantDto)
      .then((response) => {
        expect(response.status).toBe(HttpStatus.CREATED);
        expect(response.body).toBeDefined();
        expect(response.body.id).toBeDefined();
        expect(response.body.name).toBeDefined();
        expect(response.body.address).toBeDefined();
      });
  });

  it("/restaurants (GET) - should return 200 OK (paginated)", async () => {
    await request(app.getHttpServer())
      .get("/restaurants")
      .set("Cookie", [sysAdminToken])
      .set("user-agent", TEST_USER_AGENT)
      .then((response) => {
        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.data).toBeDefined();
        expect(response.body.meta).toBeDefined();
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(
          response.body.data.some(({ name }) => name === restName),
        ).toEqual(true);
      });
  });
});
