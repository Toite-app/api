import { Controller } from "@core/decorators/controller.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Body, Delete, Get, Param, Post, Put } from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  OmitType,
} from "@nestjs/swagger";
import { EnableAuditLog } from "src/@base/audit-logs/decorators/audit-logs.decorator";
import { RestaurantGuard } from "src/restaurants/@/decorators/restaurant-guard.decorator";

import { CreateRestaurantDishModifierDto } from "./dto/create-restaurant-dish-modifier.dto";
import { UpdateRestaurantDishModifierDto } from "./dto/update-restraurant-dish-modifier.dto";
import { RestaurantDishModifierEntity } from "./entities/restaurant-dish-modifier.entity";
import { RestaurantDishModifiersService } from "./restaurant-dish-modifiers.service";

export class CreateRestaurantDishModifierPayloadDto extends OmitType(
  CreateRestaurantDishModifierDto,
  ["restaurantId"] as const,
) {}

type RestaurantDishModifiersRouteParams = {
  id: string;
  modifierId?: string;
};

@Controller("restaurants/:id/dish-modifiers", {
  tags: ["restaurants"],
})
export class RestaurantDishModifiersController {
  constructor(
    private readonly restaurantDishModifiersService: RestaurantDishModifiersService,
  ) {}

  @RestaurantGuard({
    restaurantId: (req) =>
      (req.params as RestaurantDishModifiersRouteParams).id,
    allow: ["OWNER", "ADMIN", "KITCHENER", "WAITER", "CASHIER"],
  })
  @EnableAuditLog({ onlyErrors: true })
  @Get()
  @Serializable(RestaurantDishModifierEntity)
  @ApiOperation({ summary: "Gets restaurant dish modifiers" })
  @ApiOkResponse({
    description: "Restaurant dish modifiers have been successfully fetched",
    type: [RestaurantDishModifierEntity],
  })
  async findAll(@Param("id") id: string) {
    return await this.restaurantDishModifiersService.findMany(id);
  }

  @RestaurantGuard({
    restaurantId: (req) =>
      (req.params as RestaurantDishModifiersRouteParams).id,
    allow: ["OWNER", "ADMIN"],
  })
  @EnableAuditLog()
  @Post()
  @Serializable(RestaurantDishModifierEntity)
  @ApiOperation({ summary: "Creates restaurant dish modifier" })
  @ApiCreatedResponse({
    description: "Restaurant dish modifier has been successfully created",
    type: RestaurantDishModifierEntity,
  })
  @ApiForbiddenResponse({
    description: "Forbidden, allowed only for SYSTEM_ADMIN and CHIEF_ADMIN",
  })
  async create(
    @Param("id") restaurantId: string,
    @Body() dto: CreateRestaurantDishModifierPayloadDto,
  ) {
    return await this.restaurantDishModifiersService.create({
      ...dto,
      restaurantId,
    });
  }

  @RestaurantGuard({
    restaurantId: (req) =>
      (req.params as RestaurantDishModifiersRouteParams).id,
    allow: ["OWNER", "ADMIN"],
  })
  @EnableAuditLog()
  @Put(":modifierId")
  @Serializable(RestaurantDishModifierEntity)
  @ApiOperation({ summary: "Updates restaurant dish modifier" })
  @ApiOkResponse({
    description: "Restaurant dish modifier has been successfully updated",
    type: RestaurantDishModifierEntity,
  })
  @ApiForbiddenResponse({
    description: "Forbidden, allowed only for SYSTEM_ADMIN and CHIEF_ADMIN",
  })
  async update(
    @Param("modifierId") id: string,
    @Body() dto: UpdateRestaurantDishModifierDto,
  ) {
    return await this.restaurantDishModifiersService.update(id, dto);
  }

  @RestaurantGuard({
    restaurantId: (req) =>
      (req.params as RestaurantDishModifiersRouteParams).id,
    allow: ["OWNER", "ADMIN"],
  })
  @EnableAuditLog()
  @Delete(":modifierId")
  @ApiOperation({ summary: "Removes restaurant dish modifier" })
  @ApiOkResponse({
    description: "Restaurant dish modifier has been successfully removed",
  })
  @ApiForbiddenResponse({
    description: "Forbidden, allowed only for SYSTEM_ADMIN and CHIEF_ADMIN",
  })
  async remove(
    @Param("id") id: string,
    @Param("modifierId") modifierId: string,
  ) {
    await this.restaurantDishModifiersService.remove(modifierId, id);

    return;
  }
}
