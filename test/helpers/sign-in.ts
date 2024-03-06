import { HttpStatus, INestApplication } from "@nestjs/common";
import { eq } from "drizzle-orm";
import * as request from "supertest";

import { TEST_IP_ADDRESS, TEST_PASSWORD, TEST_USER_AGENT } from "./consts";
import { db, schema } from "./db";

export const signIn = async (login: string, app: INestApplication) => {
  const worker = await db.query.workers.findFirst({
    where: eq(schema.workers.login, login),
  });

  await request(app.getHttpServer())
    .post("/auth/sign-in")
    .set("user-agent", TEST_USER_AGENT)
    .send({
      login,
      password: TEST_PASSWORD,
    })
    .then((response) => {
      if (response.status !== HttpStatus.OK) {
        console.error(response);
        throw new Error("Failed to sign in");
      }
    });

  const session = await db.query.sessions.findFirst({
    where: eq(schema.sessions.workerId, worker.id),
  });

  await db.insert(schema.sessions).values({
    token: login,
    workerId: worker.id,
    httpAgent: TEST_USER_AGENT,
    ipAddress: session.ipAddress || TEST_IP_ADDRESS,
    refreshedAt: new Date(),
  });

  return login;
};
