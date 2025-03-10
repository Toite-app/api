import { Controller } from "@core/decorators/controller.decorator";
import { CursorParams, ICursor } from "@core/decorators/cursor.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Get, Param } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { EnableAuditLog } from "src/@base/audit-logs/decorators/audit-logs.decorator";
import { OrderMenuDishesCursorEntity } from "src/orders/@/entities/order-menu-dishes-cursor.entity";
import { OrderMenuService } from "src/orders/@/services/order-menu.service";

@Controller("/orders/:orderId/menu", {
  tags: ["orders"],
})
export class OrderMenuController {
  constructor(private readonly orderMenuService: OrderMenuService) {}

  @EnableAuditLog({ onlyErrors: true })
  @Serializable(OrderMenuDishesCursorEntity)
  @Get("dishes")
  @ApiOperation({
    summary: "Gets dishes that can be added to the order",
  })
  @ApiOkResponse({
    description: "Dishes that can be added to the order",
    type: OrderMenuDishesCursorEntity,
  })
  async getDishes(
    @Param("orderId") orderId: string,
    @CursorParams() cursor: ICursor,
  ): Promise<OrderMenuDishesCursorEntity> {
    const data = await this.orderMenuService.getDishes(orderId, {
      cursor,
    });

    return {
      meta: {
        cursorId: cursor.cursorId ?? null,
        limit: cursor.limit,
        total: data.length,
      },
      data,
    };
  }
}
