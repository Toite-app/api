import { PaginationResponseDto } from "@core/dto/pagination-response.entity";
import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { GuestEntity } from "src/guests/entities/guest.entity";

export class GuestsPaginatedDto extends PaginationResponseDto {
  @Expose()
  @ApiProperty({
    description: "Array of guests",
    type: [GuestEntity],
  })
  @Type(() => GuestEntity)
  data: GuestEntity[];
}
