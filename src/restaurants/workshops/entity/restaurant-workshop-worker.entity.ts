import { ApiProperty } from "@nestjs/swagger";
import { workerRoleEnum } from "@postgress-db/schema/workers";
import { Expose } from "class-transformer";

export class WorkshopWorkerEntity {
  @Expose()
  @ApiProperty({
    description: "Worker ID",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  workerId: string;

  @Expose()
  @ApiProperty({
    description: "Worker name",
    example: "John Doe",
  })
  name: string;

  @Expose()
  @ApiProperty({
    description: "Worker login",
    example: "john.doe",
  })
  login: string;

  @Expose()
  @ApiProperty({
    description: "Worker role",
    enum: workerRoleEnum.enumValues,
  })
  role: (typeof workerRoleEnum.enumValues)[number];
}
