import { Controller } from "@core/decorators/controller.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Worker } from "@core/decorators/worker.decorator";
import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { RequestWorker } from "@core/interfaces/request";
import { Body, Get, Param, Patch, Post } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from "@nestjs/swagger";
import { EnableAuditLog } from "src/@base/audit-logs/decorators/audit-logs.decorator";
import { CreateOrderDto } from "src/orders/@/dtos/create-order.dto";
import { UpdateOrderDto } from "src/orders/@/dtos/update-order.dto";
import { OrderEntity } from "src/orders/@/entities/order.entity";
import { OrderDishesService } from "src/orders/@/services/order-dishes.service";
import { OrdersService } from "src/orders/@/services/orders.service";

@Controller("orders")
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly orderDishesService: OrderDishesService,
  ) {}

  @EnableAuditLog()
  @Post()
  @Serializable(OrderEntity)
  @ApiOperation({ summary: "Creates a new order" })
  @ApiCreatedResponse({
    description: "Order has been successfully created",
    type: OrderEntity,
  })
  async create(@Body() dto: CreateOrderDto, @Worker() worker: RequestWorker) {
    return this.ordersService.create(dto, {
      workerId: worker.id,
    });
  }

  @EnableAuditLog({ onlyErrors: true })
  @Get(":id")
  @Serializable(OrderEntity)
  @ApiOperation({ summary: "Gets order by id" })
  @ApiOkResponse({
    description: "Order has been successfully fetched",
    type: OrderEntity,
  })
  @ApiNotFoundResponse({
    description: "Order with this id doesn't exist",
  })
  @ApiBadRequestResponse({
    description: "Id must be a string and provided",
  })
  async findOne(@Param("id") id?: string): Promise<OrderEntity> {
    if (!id) {
      throw new BadRequestException(
        "errors.common.id-must-be-a-string-and-provided",
      );
    }

    return await this.ordersService.findById(id);
  }

  @EnableAuditLog()
  @Patch(":id")
  @Serializable(OrderEntity)
  @ApiOperation({ summary: "Updates an order" })
  @ApiOkResponse({
    description: "Order has been successfully updated",
    type: OrderEntity,
  })
  @ApiNotFoundResponse({
    description: "Order with this id doesn't exist",
  })
  @ApiBadRequestResponse()
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateOrderDto,
    @Worker() worker: RequestWorker,
  ) {
    return this.ordersService.update(id, dto, {
      workerId: worker.id,
    });
  }
}
