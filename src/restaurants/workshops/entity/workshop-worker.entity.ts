import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IWorkshopWorker } from "@postgress-db/schema/restaurant-workshop";
import { Expose } from "class-transformer";
import { IsISO8601, IsUUID } from "class-validator";

export class WorkshopWorkerDto implements IWorkshopWorker {
  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the worker",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  workerId: string;

  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the workshop",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  workshopId: string;

  @IsISO8601()
  @Expose()
  @ApiProperty({
    description: "Timestamp when worker was assigned to workshop",
    example: "2021-01-01T00:00:00.000Z",
  })
  createdAt: Date;
}

export class CreateWorkshopWorkerDto extends OmitType(WorkshopWorkerDto, [
  "createdAt",
] as const) {}
