import {
  ApiProperty,
  IntersectionType,
  PartialType,
  PickType,
} from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsStrongPassword } from "class-validator";
import { WorkerEntity } from "src/workers/entities/worker.entity";

export class CreateWorkerDto extends IntersectionType(
  PickType(WorkerEntity, ["name", "login", "role"]),
  PartialType(
    PickType(WorkerEntity, ["isBlocked", "hiredAt", "firedAt", "restaurantId"]),
  ),
) {
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minSymbols: 0,
    minNumbers: 1,
    minUppercase: 1,
  })
  @Expose()
  @ApiProperty({
    description: "Password of the worker (if provided changes is)",
  })
  password: string;
}

export class UpdateWorkerDto extends PartialType(CreateWorkerDto) {}
