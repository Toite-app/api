import { Controller } from "@core/decorators/controller.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Worker } from "@core/decorators/worker.decorator";
import { RequestWorker } from "@core/interfaces/request";
import { Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { EnableAuditLog } from "src/@base/audit-logs/decorators/audit-logs.decorator";
import { DishesMenusService } from "src/dishes-menus/dishes-menus.service";
import { DishesMenuEntity } from "src/dishes-menus/entity/dishes-menu.entity";

@Controller("dishes-menus")
export class DishesMenusController {
  constructor(private readonly dishesMenusService: DishesMenusService) {}

  @EnableAuditLog({ onlyErrors: true })
  @Get()
  @Serializable(DishesMenuEntity)
  @ApiOperation({
    summary: "Gets all dish menus",
  })
  @ApiOkResponse({
    description: "Dish menus have been successfully fetched",
    type: [DishesMenuEntity],
  })
  async findAll(@Worker() worker: RequestWorker) {
    return this.dishesMenusService.findMany({
      worker,
    });
  }
}
