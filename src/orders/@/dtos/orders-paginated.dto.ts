import { PaginationResponseDto } from "@core/dto/pagination-response.entity";
import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { OrderEntity } from "../entities/order.entity";

export class OrdersPaginatedDto extends PaginationResponseDto {
  @Expose()
  @ApiProperty({
    description: "Array of orders",
    type: [OrderEntity],
  })
  @Type(() => OrderEntity)
  data: OrderEntity[];
}
