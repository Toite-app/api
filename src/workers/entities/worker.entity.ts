import { ApiProperty } from "@nestjs/swagger";
import { ZodWorkerRole, workers } from "@postgress-db/schema";
import { Exclude, Expose } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsNumberString,
  IsOptional,
  IsString,
} from "class-validator";

export type Worker = typeof workers.$inferSelect;

export class WorkerEntity implements Worker {
  @IsNumberString({ no_symbols: true })
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the worker",
    example: "13",
  })
  id: number;

  @IsOptional()
  @IsString()
  @Expose()
  @ApiProperty({
    description: "Name of the worker",
    example: "Dana Keller",
  })
  name: string;

  @IsString()
  @Expose()
  @ApiProperty({
    description: "Login of the worker",
    example: "dana.keller",
  })
  login: string;

  @IsString()
  @Exclude()
  passwordHash: string;

  @IsEnum(ZodWorkerRole.Enum)
  @Expose()
  @ApiProperty({
    description: "Role of the worker",
    example: ZodWorkerRole.Enum.SYSTEM_ADMIN,
    examples: Object.values(ZodWorkerRole.Enum),
  })
  role: typeof ZodWorkerRole._type;

  @IsBoolean()
  @Expose()
  @ApiProperty({
    description: "Is worker blocked",
    example: false,
  })
  isBlocked: boolean;

  @IsOptional()
  @IsISO8601()
  @Expose()
  @ApiProperty({
    description: "Date when worker was hired",
    example: new Date("2021-08-01T00:00:00.000Z"),
    type: Date,
  })
  hiredAt: Date;

  @IsOptional()
  @IsISO8601()
  @Expose()
  @ApiProperty({
    description: "Date when worker was fired",
    example: null,
    type: Date,
  })
  firedAt: Date;

  @IsOptional()
  @IsISO8601()
  @Expose()
  @ApiProperty({
    description: "Date when worker was online",
    example: new Date(),
    type: Date,
  })
  onlineAt: Date;

  @IsISO8601()
  @Expose()
  @ApiProperty({
    description: "Date when worker was created",
    example: new Date("2021-08-01T00:00:00.000Z"),
    type: Date,
  })
  createdAt: Date;

  @IsISO8601()
  @Expose()
  @ApiProperty({
    description: "Date when worker was updated",
    example: new Date("2022-03-01T05:20:52.000Z"),
    type: Date,
  })
  updatedAt: Date;
}
