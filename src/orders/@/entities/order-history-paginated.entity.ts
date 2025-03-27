import { PaginationResponseDto } from "@core/dto/pagination-response.entity";
import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { OrderHistoryEntity } from "src/orders/@/entities/order-history.entity";

export class OrderHistoryPaginatedEntity extends PaginationResponseDto {
  @Expose()
  @ApiProperty({
    description: "Array of order history records",
    type: [OrderHistoryEntity],
  })
  @Type(() => OrderHistoryEntity)
  data: OrderHistoryEntity[];
}
