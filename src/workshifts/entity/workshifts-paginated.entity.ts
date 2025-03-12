import { PaginationResponseDto } from "@core/dto/pagination-response.entity";
import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { WorkshiftEntity } from "./workshift.entity";

export class WorkshiftsPaginatedEntity extends PaginationResponseDto {
  @Expose()
  @ApiProperty({
    description: "Array of workshifts",
    type: [WorkshiftEntity],
  })
  @Type(() => WorkshiftEntity)
  data: WorkshiftEntity[];
}
