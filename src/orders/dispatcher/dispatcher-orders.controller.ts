import { Controller } from "@core/decorators/controller.decorator";
import { CursorParams, ICursor } from "@core/decorators/cursor.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Get, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { OrderTypeEnum } from "@postgress-db/schema/orders";
import { DispatcherOrdersService } from "src/orders/dispatcher/dispatcher-orders.service";
import { DispatcherOrdersPaginatedEntity } from "src/orders/dispatcher/entities/dispatcher-orders-paginated.entity";

@Controller("dispatcher/orders", {
  tags: ["dispatcher"],
})
export class DispatcherOrdersController {
  constructor(
    private readonly dispatcherOrdersService: DispatcherOrdersService,
  ) {}

  @Get()
  @Serializable(DispatcherOrdersPaginatedEntity)
  @ApiOperation({
    summary: "Gets orders for dispatcher",
  })
  @ApiOkResponse({
    description: "Orders have been successfully fetched",
    type: DispatcherOrdersPaginatedEntity,
  })
  async findMany(
    @CursorParams() cursor: ICursor,
    @Query("type") type?: string,
  ): Promise<DispatcherOrdersPaginatedEntity> {
    const data = await this.dispatcherOrdersService.findMany({
      cursor,
      type:
        type !== "undefined" && type !== "all"
          ? (type as OrderTypeEnum)
          : undefined,
    });

    return {
      data,
      meta: {
        offset: 0,
        size: 10,
        page: 1,
        total: 10,
      },
    };
  }

  @Get("attention-required")
  @Serializable(DispatcherOrdersPaginatedEntity)
  @ApiOperation({
    summary: "Gets attention required orders for dispatcher",
    description:
      "Returns orders that need dispatcher's attention - orders with pending dishes or without assigned restaurant",
  })
  @ApiOkResponse({
    description: "Attention required orders have been successfully fetched",
    type: DispatcherOrdersPaginatedEntity,
  })
  async findManyAttentionRequired(
    @Query("type") type?: string,
  ): Promise<DispatcherOrdersPaginatedEntity> {
    const data = await this.dispatcherOrdersService.findManyAttentionRequired({
      type:
        type !== "undefined" && type !== "all"
          ? (type as OrderTypeEnum)
          : undefined,
    });

    return {
      data,
      meta: {
        offset: 0,
        size: 10,
        page: 1,
        total: 10,
      },
    };
  }

  @Get("delayed")
  @Serializable(DispatcherOrdersPaginatedEntity)
  @ApiOperation({
    summary: "Gets delayed orders for dispatcher",
    description:
      "Returns orders that have been delayed and their delayed time is in the future",
  })
  @ApiOkResponse({
    description: "Delayed orders have been successfully fetched",
    type: DispatcherOrdersPaginatedEntity,
  })
  async findManyDelayed(
    @Query("type") type?: string,
  ): Promise<DispatcherOrdersPaginatedEntity> {
    const data = await this.dispatcherOrdersService.findManyDelayed({
      type:
        type !== "undefined" && type !== "all"
          ? (type as OrderTypeEnum)
          : undefined,
    });

    return {
      data,
      meta: {
        offset: 0,
        size: 10,
        page: 1,
        total: 10,
      },
    };
  }
}
