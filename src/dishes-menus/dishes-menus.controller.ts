import { Controller } from "@core/decorators/controller.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Worker } from "@core/decorators/worker.decorator";
import { RequestWorker } from "@core/interfaces/request";
import { Body, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { EnableAuditLog } from "src/@base/audit-logs/decorators/audit-logs.decorator";
import { DishesMenusService } from "src/dishes-menus/dishes-menus.service";
import { CreateDishesMenuDto } from "src/dishes-menus/dto/create-dishes-menu.dto";
import { UpdateDishesMenuDto } from "src/dishes-menus/dto/update-dishes-menu.dto";
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

  @EnableAuditLog()
  @Post()
  @Serializable(DishesMenuEntity)
  @ApiOperation({
    summary: "Creates a new dish menu",
  })
  @ApiOkResponse({
    description: "Dish menu has been successfully created",
  })
  async create(
    @Worker() worker: RequestWorker,
    @Body() payload: CreateDishesMenuDto,
  ) {
    return this.dishesMenusService.create(payload, {
      worker,
    });
  }

  @EnableAuditLog()
  @Patch(":dishesMenuId")
  @Serializable(DishesMenuEntity)
  @ApiOperation({
    summary: "Updates a dish menu",
  })
  @ApiOkResponse({
    description: "Dish menu has been successfully updated",
  })
  async update(
    @Worker() worker: RequestWorker,
    @Param("dishesMenuId") dishesMenuId: string,
    @Body() payload: UpdateDishesMenuDto,
  ) {
    return this.dishesMenusService.update(dishesMenuId, payload, {
      worker,
    });
  }
}
