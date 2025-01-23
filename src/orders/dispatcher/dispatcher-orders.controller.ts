import { Controller } from "@core/decorators/controller.decorator";
import { CursorParams, ICursor } from "@core/decorators/cursor.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
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
  ): Promise<DispatcherOrdersPaginatedEntity> {
    const data = await this.dispatcherOrdersService.findMany({ cursor });

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
  async findManyAttentionRequired(): Promise<DispatcherOrdersPaginatedEntity> {
    const data = await this.dispatcherOrdersService.findManyAttentionRequired();

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
  async findManyDelayed(): Promise<DispatcherOrdersPaginatedEntity> {
    const data = await this.dispatcherOrdersService.findManyDelayed();

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
