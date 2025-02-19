import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from "@i18n-class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IWorker,
  IWorkersToRestaurants,
  ZodWorkerRole,
} from "@postgress-db/schema/workers";
import { Exclude, Expose, Type } from "class-transformer";

export class WorkerRestaurantEntity
  implements Pick<IWorkersToRestaurants, "restaurantId">
{
  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the restaurant",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  restaurantId: string;

  @IsString()
  @Expose()
  @ApiProperty({
    description: "Name of the restaurant",
    example: "Restaurant Name",
  })
  restaurantName: string;
}

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

  @IsArray()
  @Expose()
  @Type(() => WorkerRestaurantEntity)
  @ApiProperty({
    description: "Restaurants where worker is employed",
    type: [WorkerRestaurantEntity],
  })
  restaurants: WorkerRestaurantEntity[];

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
    enum: ZodWorkerRole.Enum,
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
  @ApiPropertyOptional()
  hiredAt: Date | null;

  @IsOptional()
  @IsISO8601()
  @Expose()
  @ApiProperty({
    description: "Date when worker was fired",
    example: null,
    type: Date,
  })
  @ApiPropertyOptional()
  firedAt: Date | null;

  @IsOptional()
  @IsISO8601()
  @Expose()
  @ApiProperty({
    description: "Date when worker was online",
    example: new Date(),
    type: Date,
  })
  @ApiPropertyOptional()
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
