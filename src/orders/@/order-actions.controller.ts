import { Controller } from "@core/decorators/controller.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Worker } from "@core/decorators/worker.decorator";
import { RequestWorker } from "@core/interfaces/request";
import { Get, Param, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { OrderAvailableActionsEntity } from "src/orders/@/entities/order-available-actions.entity";
import { OrderPrecheckEntity } from "src/orders/@/entities/order-precheck.entity";
import { OrderActionsService } from "src/orders/@/services/order-actions.service";
import { OrdersService } from "src/orders/@/services/orders.service";

@Controller("orders/:id/actions", {
  tags: ["orders"],
})
export class OrderActionsController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly orderActionsService: OrderActionsService,
  ) {}

  @Get("available")
  @Serializable(OrderAvailableActionsEntity)
  @ApiOperation({ summary: "Gets available actions for the order" })
  @ApiOkResponse({
    description: "Available actions for the order",
    type: OrderAvailableActionsEntity,
  })
  async getAvailableActions(@Param("id") id: string) {
    return this.orderActionsService.getAvailableActions(id);
  }

  @Post("send-to-kitchen")
  @ApiOperation({ summary: "Sends the order to the kitchen" })
  @ApiOkResponse({
    description: "Order sent to the kitchen",
  })
  async sendToKitchen(
    @Param("id") orderId: string,
    @Worker() worker: RequestWorker,
  ) {
    return this.orderActionsService.sendToKitchen(orderId, {
      worker,
    });
  }

  @Post("precheck")
  @Serializable(OrderPrecheckEntity)
  @ApiOperation({ summary: "Creates a precheck for the order" })
  @ApiOkResponse({
    description: "Precheck created and info for it returned",
    type: OrderPrecheckEntity,
  })
  async createPrecheck(
    @Param("id") orderId: string,
    @Worker() worker: RequestWorker,
  ) {
    return this.orderActionsService.createPrecheck(orderId, {
      worker,
    });
  }
}
