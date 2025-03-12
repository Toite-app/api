import { IsDate, IsEnum, IsOptional, IsUUID } from "@i18n-class-validator";
import { ApiProperty, ApiPropertyOptional, PickType } from "@nestjs/swagger";
import {
  IWorkshift,
  ZodWorkshiftStatus,
} from "@postgress-db/schema/workshifts";
import { Expose, Type } from "class-transformer";
import { RestaurantEntity } from "src/restaurants/@/entities/restaurant.entity";
import { WorkerEntity } from "src/workers/entities/worker.entity";

export class WorkshiftRestaurantEntity extends PickType(RestaurantEntity, [
  "id",
  "name",
]) {}

export class WorkshiftEntity implements IWorkshift {
  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the workshift",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  id: string;

  @IsEnum(ZodWorkshiftStatus.Enum)
  @Expose()
  @ApiProperty({
    description: "Status of the workshift",
    enum: ZodWorkshiftStatus.Enum,
    example: ZodWorkshiftStatus.Enum.PLANNED,
    examples: Object.values(ZodWorkshiftStatus.Enum),
  })
  status: typeof ZodWorkshiftStatus._type;

  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Restaurant identifier",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  restaurantId: string;

  @Expose()
  @Type(() => WorkshiftRestaurantEntity)
  @ApiProperty({
    description: "Restaurant",
    type: WorkshiftRestaurantEntity,
  })
  restaurant: WorkshiftRestaurantEntity;

  @IsUUID()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional({
    description: "Worker who opened the workshift",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  openedByWorkerId: string | null;

  @IsUUID()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional({
    description: "Worker who closed the workshift",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  closedByWorkerId: string | null;

  @IsDate()
  @Expose()
  @ApiProperty({
    description: "Date when workshift was created",
    example: new Date(),
  })
  createdAt: Date;

  @IsDate()
  @Expose()
  @ApiProperty({
    description: "Date when workshift was last updated",
    example: new Date(),
  })
  updatedAt: Date;

  @IsDate()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional({
    description: "Date when workshift was opened",
    example: null,
  })
  openedAt: Date | null;

  @IsDate()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional({
    description: "Date when workshift was closed",
    example: null,
  })
  closedAt: Date | null;

  @Expose()
  @Type(() => WorkerEntity)
  @ApiPropertyOptional({
    description: "Worker who opened the workshift",
    type: WorkerEntity,
  })
  openedByWorker?: WorkerEntity;

  @Expose()
  @Type(() => WorkerEntity)
  @ApiPropertyOptional({
    description: "Worker who closed the workshift",
    type: WorkerEntity,
  })
  closedByWorker?: WorkerEntity;

  @Expose()
  @Type(() => WorkerEntity)
  @ApiProperty({
    description: "Workers assigned to this workshift",
    type: [WorkerEntity],
  })
  workers?: WorkerEntity[];
}
