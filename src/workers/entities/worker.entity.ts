import { ApiProperty } from "@nestjs/swagger";
import { IWorker, ZodWorkerRole } from "@postgress-db/schema/workers";
import { Exclude, Expose } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from "class-validator";

export class WorkerEntity implements IWorker {
  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the worker",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  id: string;

  @IsString()
  @Expose()
  @ApiProperty({
    description: "Name of the worker",
    example: "V Keller",
  })
  name: string;

  @IsOptional()
  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the restaurant",
    example: null,
  })
  restaurantId: string | null;

  @IsOptional()
  @IsString()
  @Expose()
  @ApiProperty({
    description: "Name of the restaurant where worker is employed",
    example: "Restaurant Name",
    type: String,
  })
  restaurantName: string | null;

  @IsString()
  @MinLength(4)
  @Expose()
  @ApiProperty({
    description: "Login of the worker",
    example: "v.keller",
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
  hiredAt: Date | null;

  @IsOptional()
  @IsISO8601()
  @Expose()
  @ApiProperty({
    description: "Date when worker was fired",
    example: null,
    type: Date,
  })
  firedAt: Date | null;

  @IsOptional()
  @IsISO8601()
  @Expose()
  @ApiProperty({
    description: "Date when worker was online",
    example: new Date(),
    type: Date,
  })
  onlineAt: Date | null;

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
