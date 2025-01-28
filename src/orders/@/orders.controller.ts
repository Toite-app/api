import { Controller } from "@core/decorators/controller.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { Body, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from "@nestjs/swagger";
import { AddOrderDishDto } from "src/orders/@/dtos/add-order-dish.dto";
import { CreateOrderDto } from "src/orders/@/dtos/create-order.dto";
import { UpdateOrderDishDto } from "src/orders/@/dtos/update-order-dish.dto";
import { OrderEntity } from "src/orders/@/entities/order.entity";
import { OrderDishesService } from "src/orders/@/services/order-dishes.service";
import { OrdersService } from "src/orders/@/services/orders.service";

@Controller("orders")
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly orderDishesService: OrderDishesService,
  ) {}

  @Post()
  @Serializable(OrderEntity)
  @ApiOperation({ summary: "Creates a new order" })
  @ApiCreatedResponse({
    description: "Order has been successfully created",
    type: OrderEntity,
  })
  async create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

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

  @Post(":id/dishes")
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
  ) {
    await this.orderDishesService.addToOrder(orderId, payload);

    return this.ordersService.findById(orderId);
  }

  @Patch(":id/dishes/:orderDishId")
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
  ) {
    await this.orderDishesService.update(orderDishId, payload);

    return this.ordersService.findById(orderId);
  }

  @Delete(":id/dishes/:orderDishId")
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
  ) {
    await this.orderDishesService.remove(orderDishId);

    return this.ordersService.findById(orderId);
  }
}
