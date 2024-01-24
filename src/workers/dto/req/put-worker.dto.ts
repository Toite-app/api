import { ApiProperty, PartialType, PickType } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsStrongPassword } from "class-validator";
import { WorkerEntity } from "src/workers/entities/worker.entity";

export class CreateWorkerDto extends PickType(WorkerEntity, [
  "name",
  "login",
  "role",
  "isBlocked",
  "hiredAt",
  "firedAt",
  "onlineAt",
]) {
  @IsStrongPassword()
  @Expose()
  @ApiProperty({
    description: "Password of the worker (if provided changes is)",
  })
  password: string;
}

export class PutWorkerDto extends PartialType(CreateWorkerDto) {}
