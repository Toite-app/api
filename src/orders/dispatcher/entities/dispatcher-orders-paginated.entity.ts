import { PaginationResponseDto } from "@core/dto/pagination-response.entity";
import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { DispatcherOrderEntity } from "src/orders/dispatcher/entities/dispatcher-order.entity";

export class DispatcherOrdersPaginatedEntity extends PaginationResponseDto {
  @Expose()
  @ApiProperty({
    description: "Array of orders",
    type: [DispatcherOrderEntity],
  })
  @Type(() => DispatcherOrderEntity)
  data: DispatcherOrderEntity[];
}
