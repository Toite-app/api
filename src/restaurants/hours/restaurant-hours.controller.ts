import { Controller } from "@core/decorators/controller.decorator";
import { Roles } from "@core/decorators/roles.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Body, Delete, Get, Param, Post, Put } from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  OmitType,
} from "@nestjs/swagger";
import { RequireSessionAuth } from "src/auth/decorators/session-auth.decorator";

import {
  CreateRestaurantHoursDto,
  RestaurantHoursEntity,
  UpdateRestaurantHoursDto,
} from "./entities/restaurant-hours.entity";
import { RestaurantHoursService } from "./restaurant-hours.service";

export class CreateRestaurantHoursPayloadDto extends OmitType(
  CreateRestaurantHoursDto,
  ["restaurantId"] as const,
) {}

@RequireSessionAuth()
@Controller("restaurants/:id/hours", {
  tags: ["restaurants"],
})
export class RestaurantHoursController {
  constructor(
    private readonly restaurantHoursService: RestaurantHoursService,
  ) {}

  @Get()
  @Serializable(RestaurantHoursEntity)
  @ApiOperation({ summary: "Gets restaurant hours" })
  @ApiOkResponse({
    description: "Restaurant hours have been successfully fetched",
    type: [RestaurantHoursEntity],
  })
  async findAll(@Param("id") id: string) {
    return await this.restaurantHoursService.findMany(id);
  }

  @Post()
  @Roles("SYSTEM_ADMIN", "CHIEF_ADMIN")
  @ApiOperation({ summary: "Creates restaurant hours" })
  @ApiCreatedResponse({
    description: "Restaurant hours have been successfully created",
  })
  @ApiForbiddenResponse({
    description: "Forbidden, allowed only for SYSTEM_ADMIN and CHIEF_ADMIN",
  })
  async create(
    @Param("id") restaurantId: string,
    @Body() dto: CreateRestaurantHoursPayloadDto,
  ) {
    return await this.restaurantHoursService.create({
      ...dto,
      restaurantId,
    });
  }

  @Put(":hoursId")
  @Roles("SYSTEM_ADMIN", "CHIEF_ADMIN")
  @Serializable(RestaurantHoursEntity)
  @ApiOperation({ summary: "Updates restaurant hours" })
  @ApiOkResponse({
    description: "Restaurant hours have been successfully updated",
  })
  @ApiForbiddenResponse({
    description: "Forbidden, allowed only for SYSTEM_ADMIN and CHIEF_ADMIN",
  })
  async update(
    @Param("hoursId") id: string,
    @Body() dto: UpdateRestaurantHoursDto,
  ) {
    return await this.restaurantHoursService.update(id, dto);
  }

  @Delete(":hoursId")
  @Roles("SYSTEM_ADMIN", "CHIEF_ADMIN")
  @ApiOperation({ summary: "Deletes restaurant hours" })
  @ApiOkResponse({
    description: "Restaurant hours have been successfully deleted",
  })
  @ApiForbiddenResponse({
    description: "Forbidden, allowed only for SYSTEM_ADMIN and CHIEF_ADMIN",
  })
  async delete(@Param("id") id: string, @Param("hoursId") hoursId: string) {
    await this.restaurantHoursService.delete(hoursId, id);

    return;
  }
}
