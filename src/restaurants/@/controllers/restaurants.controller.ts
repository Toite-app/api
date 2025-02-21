import { Controller } from "@core/decorators/controller.decorator";
import {
  IPagination,
  PaginationParams,
} from "@core/decorators/pagination.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Worker } from "@core/decorators/worker.decorator";
import { RequestWorker } from "@core/interfaces/request";
import { Body, Delete, Get, Param, Post, Put } from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { EnableAuditLog } from "src/@base/audit-logs/decorators/audit-logs.decorator";
import { RestaurantGuard } from "src/restaurants/@/decorators/restaurant-guard.decorator";

import { CreateRestaurantDto } from "../dto/create-restaurant.dto";
import { UpdateRestaurantDto } from "../dto/update-restaurant.dto";
import { RestaurantsPaginatedDto } from "../dto/views/get-restaurants.view";
import { RestaurantEntity } from "../entities/restaurant.entity";
import { RestaurantsService } from "../services/restaurants.service";

@Controller("restaurants")
@ApiForbiddenResponse({ description: "Forbidden" })
@ApiUnauthorizedResponse({ description: "Unauthorized" })
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @EnableAuditLog({ onlyErrors: true })
  @Get()
  @ApiOperation({
    summary: "Gets restaurants that created in system",
  })
  @Serializable(RestaurantsPaginatedDto)
  @ApiOkResponse({
    description: "Restaurants have been successfully fetched",
    type: RestaurantsPaginatedDto,
  })
  async findAll(
    @PaginationParams() pagination: IPagination,
    @Worker() worker: RequestWorker,
  ) {
    const total = await this.restaurantsService.getTotalCount();
    const data = await this.restaurantsService.findMany({
      pagination,
      worker,
    });

    return {
      data,
      meta: {
        ...pagination,
        total,
      },
    };
  }

  @EnableAuditLog()
  @Post()
  @Serializable(RestaurantEntity)
  @ApiOperation({
    summary: "Creates a new restaurant",
  })
  @ApiCreatedResponse({
    description: "Restaurant has been successfully created",
    type: RestaurantEntity,
  })
  @ApiForbiddenResponse({
    description: "Action available only for SYSTEM_ADMIN, CHIEF_ADMIN",
  })
  async create(
    @Body() dto: CreateRestaurantDto,
    @Worker() worker: RequestWorker,
  ): Promise<RestaurantEntity> {
    return await this.restaurantsService.create(dto, {
      worker,
    });
  }

  @RestaurantGuard({
    restaurantId: (req) => req.params.id,
    allow: ["OWNER", "ADMIN", "KITCHENER", "WAITER", "CASHIER"],
  })
  @Get(":id")
  @Serializable(RestaurantEntity)
  @ApiOperation({
    summary: "Gets restaurant by id",
  })
  @ApiOkResponse({
    description: "Restaurant has been successfully fetched",
    type: RestaurantEntity,
  })
  @ApiNotFoundResponse({
    description: "Restaurant with this id not found",
  })
  async findOne(
    @Param("id") id: string,
    @Worker() worker: RequestWorker,
  ): Promise<RestaurantEntity> {
    return await this.restaurantsService.findById(id, {
      worker,
    });
  }

  @RestaurantGuard({
    restaurantId: (req) => req.params.id,
    allow: ["OWNER", "ADMIN"],
  })
  @EnableAuditLog()
  @Put(":id")
  @Serializable(RestaurantEntity)
  @ApiOperation({
    summary: "Updates restaurant by id",
  })
  @ApiOkResponse({
    description: "Restaurant has been successfully updated",
    type: RestaurantEntity,
  })
  @ApiNotFoundResponse({
    description: "Restaurant with this id not found",
  })
  @ApiForbiddenResponse({
    description: "Action available only for SYSTEM_ADMIN, CHIEF_ADMIN",
  })
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateRestaurantDto,
  ): Promise<RestaurantEntity> {
    return await this.restaurantsService.update(id, dto);
  }

  @RestaurantGuard({
    restaurantId: (req) => req.params.id,
    allow: ["OWNER"],
  })
  @EnableAuditLog()
  @Delete(":id")
  @ApiOperation({
    summary: "Deletes restaurant by id",
  })
  @ApiNoContentResponse({
    description: "Restaurant has been successfully deleted",
  })
  @ApiNotFoundResponse({
    description: "Restaurant with this id not found",
  })
  @ApiForbiddenResponse({
    description: "Action available only for SYSTEM_ADMIN",
  })
  async delete(@Param("id") id: string): Promise<void> {
    return await this.restaurantsService.delete(id);
  }
}
