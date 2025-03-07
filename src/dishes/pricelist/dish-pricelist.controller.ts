import { Controller } from "@core/decorators/controller.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Body, Get, Param, Put } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { EnableAuditLog } from "src/@base/audit-logs/decorators/audit-logs.decorator";

import { DishPricelistService } from "./dish-pricelist.service";
import { UpdateDishPricelistDto } from "./dto/update-dish-pricelist.dto";
import DishPricelistItemEntity from "./entities/dish-pricelist-item.entity";

@Controller("dishes/:id/pricelist", {
  tags: ["dishes"],
})
export class DishPricelistController {
  constructor(private readonly dishPricelistService: DishPricelistService) {}

  @EnableAuditLog({ onlyErrors: true })
  @Get()
  @Serializable(DishPricelistItemEntity)
  @ApiOperation({
    summary: "Get dish pricelist",
  })
  @ApiResponse({
    status: 200,
    description: "Returns dish pricelist items",
    type: [DishPricelistItemEntity],
  })
  async getPricelist(@Param("id") dishId: string) {
    return this.dishPricelistService.getPricelist(dishId);
  }

  @EnableAuditLog()
  @Put(":restaurantId")
  @Serializable(DishPricelistItemEntity)
  @ApiOperation({
    summary: "Update dish pricelist for restaurant",
  })
  @ApiResponse({
    status: 200,
    description: "Returns updated dish pricelist item",
    type: DishPricelistItemEntity,
  })
  async updatePricelist(
    @Param("id") dishId: string,
    @Param("restaurantId") restaurantId: string,
    @Body() dto: UpdateDishPricelistDto,
  ) {
    // TODO: Add validation of worker role/restaurant access
    return this.dishPricelistService.updatePricelist(dishId, restaurantId, dto);
  }
}
