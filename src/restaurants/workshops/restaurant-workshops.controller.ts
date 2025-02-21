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

import { UpdateRestaurantWorkshopWorkersDto } from "./dto/put-restaurant-workshop-workers.dto";
import { WorkshopWorkerEntity } from "./entity/restaurant-workshop-worker.entity";
import {
  CreateRestaurantWorkshopDto,
  RestaurantWorkshopDto,
  UpdateRestaurantWorkshopDto,
} from "./entity/restaurant-workshop.entity";
import { RestaurantWorkshopsService } from "./restaurant-workshops.service";

export class CreateRestaurantWorkshopPayloadDto extends OmitType(
  CreateRestaurantWorkshopDto,
  ["restaurantId"] as const,
) {}

@Controller("restaurants/:id/workshops", {
  tags: ["restaurants"],
})
export class RestaurantWorkshopsController {
  constructor(
    private readonly restaurantWorkshopsService: RestaurantWorkshopsService,
  ) {}

  @RestaurantGuard({
    restaurantId: (req) => req.params.id,
    allow: ["OWNER", "ADMIN", "KITCHENER", "WAITER", "CASHIER"],
  })
  @EnableAuditLog({ onlyErrors: true })
  @Get()
  @Serializable(RestaurantWorkshopDto)
  @ApiOperation({ summary: "Gets restaurant workshops" })
  @ApiOkResponse({
    description: "Restaurant workshops have been successfully fetched",
    type: [RestaurantWorkshopDto],
  })
  async findAll(@Param("id") id: string) {
    return await this.restaurantWorkshopsService.findMany(id);
  }

  @RestaurantGuard({
    restaurantId: (req) => req.params.id,
    allow: ["OWNER", "ADMIN"],
  })
  @EnableAuditLog()
  @Post()
  @ApiOperation({ summary: "Creates restaurant workshop" })
  @ApiCreatedResponse({
    description: "Restaurant workshop has been successfully created",
  })
  @ApiForbiddenResponse({
    description: "Forbidden, allowed only for SYSTEM_ADMIN and CHIEF_ADMIN",
  })
  async create(
    @Param("id") restaurantId: string,
    @Body() dto: CreateRestaurantWorkshopPayloadDto,
  ) {
    return await this.restaurantWorkshopsService.create({
      ...dto,
      restaurantId,
    });
  }

  @RestaurantGuard({
    restaurantId: (req) => req.params.id,
    allow: ["OWNER", "ADMIN"],
  })
  @EnableAuditLog()
  @Put(":workshopId")
  @Serializable(RestaurantWorkshopDto)
  @ApiOperation({ summary: "Updates restaurant workshop" })
  @ApiOkResponse({
    description: "Restaurant workshop has been successfully updated",
  })
  @ApiForbiddenResponse({
    description: "Forbidden, allowed only for SYSTEM_ADMIN and CHIEF_ADMIN",
  })
  async update(
    @Param("workshopId") id: string,
    @Body() dto: UpdateRestaurantWorkshopDto,
  ) {
    return await this.restaurantWorkshopsService.update(id, dto);
  }

  @RestaurantGuard({
    restaurantId: (req) => req.params.id,
    allow: ["OWNER", "ADMIN", "KITCHENER", "WAITER", "CASHIER"],
  })
  @EnableAuditLog({ onlyErrors: true })
  @Get(":workshopId/workers")
  @Serializable(WorkshopWorkerEntity)
  @ApiOperation({ summary: "Gets workshop workers" })
  @ApiOkResponse({
    description: "Workshop workers have been successfully fetched",
    type: [WorkshopWorkerEntity],
  })
  async getWorkers(@Param("workshopId") id: string) {
    return await this.restaurantWorkshopsService.getWorkers(id);
  }

  @RestaurantGuard({
    restaurantId: (req) => req.params.id,
    allow: ["OWNER", "ADMIN"],
  })
  @EnableAuditLog()
  @Put(":workshopId/workers")
  @ApiOperation({ summary: "Updates workshop workers" })
  @ApiOkResponse({
    description: "Workshop workers have been successfully updated",
  })
  @ApiForbiddenResponse({
    description: "Forbidden, allowed only for SYSTEM_ADMIN and CHIEF_ADMIN",
  })
  async updateWorkers(
    @Param("workshopId") id: string,
    @Body() dto: UpdateRestaurantWorkshopWorkersDto,
  ) {
    await this.restaurantWorkshopsService.updateWorkers(id, dto.workerIds);
    return;
  }

  @RestaurantGuard({
    restaurantId: (req) => req.params.id,
    allow: ["OWNER", "ADMIN"],
  })
  @EnableAuditLog()
  @Delete(":workshopId")
  @ApiOperation({ summary: "Deletes restaurant workshop" })
  @ApiOkResponse({
    description: "Restaurant workshop has been successfully deleted",
  })
  @ApiForbiddenResponse({
    description: "Forbidden, allowed only for SYSTEM_ADMIN and CHIEF_ADMIN",
  })
  async delete(
    @Param("id") id: string,
    @Param("workshopId") workshopId: string,
  ) {
    await this.restaurantWorkshopsService.delete(workshopId, id);

    return;
  }
}
