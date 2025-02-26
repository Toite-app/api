import { Controller } from "@core/decorators/controller.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Worker } from "@core/decorators/worker.decorator";
import { RequestWorker } from "@core/interfaces/request";
import { Get, Param, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { EnableAuditLog } from "src/@base/audit-logs/decorators/audit-logs.decorator";
import { KitchenerOrderEntity } from "src/orders/kitchener/entities/kitchener-order.entity";
import { KitchenerOrderActionsService } from "src/orders/kitchener/kitchener-order-actions.service";
import { KitchenerOrdersService } from "src/orders/kitchener/kitchener-orders.service";

@Controller("kitchener/orders", {
  tags: ["kitchener"],
})
export class KitchenerOrdersController {
  constructor(
    private readonly kitchenerOrdersService: KitchenerOrdersService,
    private readonly kitchenerOrderActionsService: KitchenerOrderActionsService,
  ) {}

  @EnableAuditLog({ onlyErrors: true })
  @Get()
  @Serializable(KitchenerOrderEntity)
  @ApiOperation({
    summary: "Gets orders for kitchener",
  })
  @ApiOkResponse({
    description: "Orders have been successfully fetched",
    type: [KitchenerOrderEntity],
  })
  async findMany(@Worker() worker: RequestWorker) {
    const data = await this.kitchenerOrdersService.findMany({
      worker,
    });

    return data;
  }

  @EnableAuditLog()
  @Post(":orderId/dishes/:orderDishId/ready")
  @ApiOperation({
    description: "Marks order dish as ready",
  })
  @ApiOkResponse({
    description: "Order dish has been successfully marked as ready",
  })
  async markOrderDishAsReady(
    @Param("orderId") orderId: string,
    @Param("orderDishId") orderDishId: string,
    @Worker() worker: RequestWorker,
  ) {
    await this.kitchenerOrderActionsService.markDishAsReady(orderDishId, {
      worker,
    });

    return true;
  }
}
