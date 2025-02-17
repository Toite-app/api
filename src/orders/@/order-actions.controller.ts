import { Controller } from "@core/decorators/controller.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Get, Param } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { OrderAvailableActionsEntity } from "src/orders/@/entities/order-available-actions.entity";
import { OrdersService } from "src/orders/@/services/orders.service";

@Controller("orders/:id/actions", {
  tags: ["orders"],
})
export class OrderActionsController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get("available")
  @Serializable(OrderAvailableActionsEntity)
  @ApiOperation({ summary: "Gets available actions for the order" })
  @ApiOkResponse({
    description: "Available actions for the order",
    type: OrderAvailableActionsEntity,
  })
  async getAvailableActions(@Param("id") id: string) {
    return this.ordersService.getAvailableActions(id);
  }
}
