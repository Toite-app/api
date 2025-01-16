import { Controller } from "@core/decorators/controller.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Get, Param } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";

import { DishPricelistService } from "./dish-pricelist.service";
import DishPricelistItemEntity from "./entities/dish-pricelist-item.entity";

@Controller("dishes/:id/pricelist", {
  tags: ["dishes"],
})
export class DishPricelistController {
  constructor(private readonly dishPricelistService: DishPricelistService) {}

  @Get()
  @Serializable(DishPricelistItemEntity)
  @ApiOperation({ summary: "Get dish pricelist" })
  @ApiResponse({
    status: 200,
    description: "Returns dish pricelist items",
    type: [DishPricelistItemEntity],
  })
  async getPricelist(@Param("id") dishId: string) {
    return this.dishPricelistService.getPricelist(dishId);
  }
}
