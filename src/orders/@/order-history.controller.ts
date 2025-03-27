import { Controller } from "@core/decorators/controller.decorator";
import {
  IPagination,
  PaginationParams,
} from "@core/decorators/pagination.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Get, Param } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { EnableAuditLog } from "src/@base/audit-logs/decorators/audit-logs.decorator";
import { CacheRequest } from "src/@base/cache/cache.decorator";
import { OrderHistoryPaginatedEntity } from "src/orders/@/entities/order-history-paginated.entity";
import { OrderHistoryService } from "src/orders/@/services/order-history.service";

@Controller("orders/:orderId/history", {
  tags: ["orders"],
})
export class OrderHistoryController {
  constructor(private readonly orderHistoryService: OrderHistoryService) {}

  @EnableAuditLog({ onlyErrors: true })
  @Serializable(OrderHistoryPaginatedEntity)
  @Get()
  @CacheRequest({ ttl: 5 })
  @ApiOperation({
    summary: "Finds all history records for an order",
    description: "Returns a paginated list of order history records",
  })
  @ApiOkResponse({
    type: OrderHistoryPaginatedEntity,
  })
  public async findMany(
    @PaginationParams({
      default: {
        limit: 100,
      },
    })
    pagination: IPagination,
    @Param("orderId") orderId: string,
  ): Promise<OrderHistoryPaginatedEntity> {
    const total = await this.orderHistoryService.getTotalCount(orderId);
    const data = await this.orderHistoryService.findMany(orderId, {
      limit: pagination.limit,
      offset: pagination.offset,
    });

    return {
      data,
      ...pagination,
      meta: {
        page: pagination.page,
        size: pagination.limit,
        offset: pagination.offset,
        total,
      },
    };
  }
}
