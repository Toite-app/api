import { Controller } from "@core/decorators/controller.decorator";
import { FilterParams, IFilters } from "@core/decorators/filter.decorator";
import {
  IPagination,
  PaginationParams,
} from "@core/decorators/pagination.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { ISorting, SortingParams } from "@core/decorators/sorting.decorator";
import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { Body, Get, Param, Post } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from "@nestjs/swagger";
import { CreateOrderDto } from "src/orders/@/dtos/create-order.dto";
import { OrderEntity } from "src/orders/@/entities/order.entity";
import { OrdersService } from "src/orders/@/orders.service";

import { OrdersPaginatedDto } from "./dtos/orders-paginated.dto";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

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

  @Get()
  @ApiOperation({
    summary: "Gets orders that available in system",
  })
  @ApiOkResponse({
    description: "Orders have been successfully fetched",
    type: OrdersPaginatedDto,
  })
  async findMany(
    @SortingParams({
      fields: [
        "id",
        "number",
        "type",
        "status",
        "guestName",
        "total",
        "createdAt",
        "updatedAt",
      ],
    })
    sorting: ISorting,
    @PaginationParams() pagination: IPagination,
    @FilterParams() filters?: IFilters,
  ): Promise<OrdersPaginatedDto> {
    const total = await this.ordersService.getTotalCount(filters);
    const data = await this.ordersService.findMany({
      pagination,
      sorting,
      filters,
    });

    return {
      data,
      meta: {
        ...pagination,
        total,
      },
    };
  }

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
}
