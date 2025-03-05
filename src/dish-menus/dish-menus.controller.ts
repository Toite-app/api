import { Controller } from "@core/decorators/controller.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { EnableAuditLog } from "src/@base/audit-logs/decorators/audit-logs.decorator";
import { DishMenuEntity } from "src/dish-menus/entity/dish-menu.entity";

@Controller("dish-menus")
export class DishMenusController {
  @EnableAuditLog({ onlyErrors: true })
  @Get()
  @Serializable(DishMenuEntity)
  @ApiOperation({
    summary: "Gets all dish menus",
  })
  @ApiOkResponse({
    description: "Dish menus have been successfully fetched",
    type: [DishMenuEntity],
  })
  async findAll() {}
}
