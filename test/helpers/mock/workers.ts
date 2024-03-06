import { faker } from "@faker-js/faker";
import { CreateWorkerDto } from "src/workers/dto/req/put-worker.dto";

import { TEST_PASSWORD } from "../consts";
import { schema } from "../db";

export const mockWorkers = (length: number = 20): CreateWorkerDto[] => {
  return Array.from({ length }, () => {
    const name = faker.person.fullName();

    return {
      login: faker.internet.userName({
        firstName: name.split(" ")[0],
        lastName: name.split(" ")[1],
      }),
      name,
      isBlocked: false,
      role: faker.helpers.arrayElement(
        Object.values(schema.ZodWorkerRole.Enum).filter(
          (role) => role !== schema.ZodWorkerRole.Enum.SYSTEM_ADMIN,
        ),
      ),
      hiredAt: faker.date.past(),
      firedAt: faker.helpers.arrayElement([null, faker.date.past()]),
      onlineAt: faker.date.recent(),
      password: TEST_PASSWORD,
    } as CreateWorkerDto;
  });
};
