import { Controller } from "@core/decorators/controller.decorator";
import { CursorParams, ICursor } from "@core/decorators/cursor.decorator";
import SearchQuery from "@core/decorators/search.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { StringValuePipe } from "@core/pipes/string.pipe";
import { Get, Param, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { EnableAuditLog } from "src/@base/audit-logs/decorators/audit-logs.decorator";
import { DishCategoryEntity } from "src/dish-categories/entities/dish-category.entity";
import { OrderMenuDishesCursorEntity } from "src/orders/@/entities/order-menu-dishes-cursor.entity";
import { OrderMenuService } from "src/orders/@/services/order-menu.service";

@Controller("/orders/:orderId/menu", {
  tags: ["orders"],
})
export class OrderMenuController {
  constructor(private readonly orderMenuService: OrderMenuService) {}

  @EnableAuditLog({ onlyErrors: true })
  @Serializable(DishCategoryEntity)
  @Get("categories")
  @ApiOperation({
    summary:
      "Gets list of dish categories that are available for the order dishes",
  })
  @ApiOkResponse({
    description: "List of dish categories",
    type: DishCategoryEntity,
  })
  async getDishCategories(
    @Param("orderId") orderId: string,
  ): Promise<DishCategoryEntity[]> {
    return this.orderMenuService.findDishCategories(orderId);
  }

  @EnableAuditLog({ onlyErrors: true })
  @Serializable(OrderMenuDishesCursorEntity)
  @Get("dishes")
  @ApiOperation({
    summary: "Gets dishes that can be added to the order",
  })
  @ApiOkResponse({
    description: "Dishes that can be added to the order",
    type: OrderMenuDishesCursorEntity,
  })
  @ApiQuery({
    name: "categoryId",
    type: String,
    required: false,
    description: "Filter dishes by category id",
  })
  async getDishes(
    @Param("orderId") orderId: string,
    @CursorParams() cursor: ICursor,
    @SearchQuery() search?: string,
    @Query("categoryId", new StringValuePipe()) dishCategoryId?: string,
  ): Promise<OrderMenuDishesCursorEntity> {
    const data = await this.orderMenuService.getDishes(orderId, {
      cursor,
      search,
      dishCategoryId,
    });

    return {
      meta: {
        cursorId: cursor.cursorId ?? null,
        limit: cursor.limit,
        total: data.length,
      },
      data,
    };
  }
}
