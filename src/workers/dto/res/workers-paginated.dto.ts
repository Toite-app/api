import { PaginationResponseDto } from "@core/dto/pagination-response.entity";
import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { WorkerEntity } from "src/workers/entities/worker.entity";

export class WorkersPaginatedDto extends PaginationResponseDto {
  @Expose()
  @ApiProperty({
    description: "Array of workers",
    type: [WorkerEntity],
  })
  @Type(() => WorkerEntity)
  data: WorkerEntity[];
}
