import { Controller } from "@core/decorators/controller.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Worker } from "@core/decorators/worker.decorator";
import { RequestWorker } from "@core/interfaces/request";
import { Body, Delete, Param, Patch, Post, Put } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from "@nestjs/swagger";
import { EnableAuditLog } from "src/@base/audit-logs/decorators/audit-logs.decorator";
import { AddOrderDishDto } from "src/orders/@/dtos/add-order-dish.dto";
import { PutOrderDishModifiersDto } from "src/orders/@/dtos/put-order-dish-modifiers";
import { UpdateOrderDishDto } from "src/orders/@/dtos/update-order-dish.dto";
import { OrderEntity } from "src/orders/@/entities/order.entity";
import { OrderDishesService } from "src/orders/@/services/order-dishes.service";
import { OrdersService } from "src/orders/@/services/orders.service";
import { KitchenerOrderActionsService } from "src/orders/kitchener/kitchener-order-actions.service";

@Controller("orders/:id/dishes", {
  tags: ["orders"],
})
export class OrderDishesController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly orderDishesService: OrderDishesService,
    private readonly kitchenerOrderActionsService: KitchenerOrderActionsService,
  ) {}

  @EnableAuditLog()
  @Post()
  @Serializable(OrderEntity)
  @ApiOperation({ summary: "Adds a dish to the order" })
  @ApiOkResponse({
    description: "Dish has been successfully added to the order",
    type: OrderEntity,
  })
  @ApiNotFoundResponse({
    description: "Order with this id doesn't exist",
  })
  @ApiBadRequestResponse({
    description: "Dish with this id doesn't exist",
  })
  async addDish(
    @Param("id") orderId: string,
    @Body() payload: AddOrderDishDto,
    @Worker() worker: RequestWorker,
  ) {
    await this.orderDishesService.addToOrder(orderId, payload, {
      workerId: worker.id,
    });

    return this.ordersService.findById(orderId);
  }

  @EnableAuditLog()
  @Patch(":orderDishId")
  @Serializable(OrderEntity)
  @ApiOperation({ summary: "Updates a dish in the order" })
  @ApiOkResponse({
    description: "Dish has been successfully updated in the order",
    type: OrderEntity,
  })
  @ApiNotFoundResponse({
    description: "Order with this id doesn't exist",
  })
  @ApiBadRequestResponse()
  async updateDish(
    @Param("id") orderId: string,
    @Param("orderDishId") orderDishId: string,
    @Body() payload: UpdateOrderDishDto,
    @Worker() worker: RequestWorker,
  ) {
    await this.orderDishesService.update(orderDishId, payload, {
      workerId: worker.id,
    });

    return this.ordersService.findById(orderId);
  }

  @EnableAuditLog()
  @Delete(":orderDishId")
  @ApiOperation({ summary: "Removes a dish from the order" })
  @ApiOkResponse({
    description: "Dish has been successfully removed from the order",
    type: OrderEntity,
  })
  @ApiNotFoundResponse({
    description: "Order with this id doesn't exist",
  })
  @ApiBadRequestResponse()
  async removeDish(
    @Param("id") orderId: string,
    @Param("orderDishId") orderDishId: string,
    @Worker() worker: RequestWorker,
  ) {
    await this.orderDishesService.remove(orderDishId, {
      workerId: worker.id,
    });

    return this.ordersService.findById(orderId);
  }

  @EnableAuditLog()
  @Post(":orderDishId/force-ready")
  @ApiOperation({ summary: "Forces a dish to be ready" })
  @ApiOkResponse({
    description: "Dish has been successfully marked as ready",
  })
  async forceReadyDish(
    @Param("id") orderId: string,
    @Param("orderDishId") orderDishId: string,
    @Worker() worker: RequestWorker,
  ) {
    await this.kitchenerOrderActionsService.markDishAsReady(orderDishId, {
      worker,
    });

    return this.ordersService.findById(orderId);
  }

  @EnableAuditLog()
  @Put(":orderDishId/modifiers")
  @ApiOperation({ summary: "Updates the modifiers for a dish in the order" })
  @ApiOkResponse({
    description: "Dish modifiers have been successfully updated",
  })
  async updateDishModifiers(
    @Param("id") orderId: string,
    @Param("orderDishId") orderDishId: string,
    @Body() payload: PutOrderDishModifiersDto,
  ) {
    await this.orderDishesService.updateDishModifiers(orderDishId, payload);

    return true;
  }
}
