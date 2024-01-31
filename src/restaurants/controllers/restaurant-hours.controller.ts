import { Controller } from "@core/decorators/controller.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Body, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { RequireSessionAuth } from "src/auth/decorators/session-auth.decorator";
import {
  CreateRestaurantHoursDto,
  RestaurantHoursDto,
  UpdateRestaurantHoursDto,
} from "../dto/restaurant-hours.dto";
import {
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  OmitType,
} from "@nestjs/swagger";
import { RestaurantHoursService } from "../services/restaurant-hours.service";
import { Roles } from "@core/decorators/roles.decorator";

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
  @Serializable(RestaurantHoursDto)
  @ApiOperation({ summary: "Gets restaurant hours" })
  @ApiOkResponse({
    description: "Restaurant hours have been successfully fetched",
    type: [RestaurantHoursDto],
  })
  async findAll(@Param("id") id: number) {
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
    @Param("id") restaurantId: number,
    @Body() dto: CreateRestaurantHoursPayloadDto,
  ) {
    return await this.restaurantHoursService.create({
      ...dto,
      restaurantId,
    });
  }

  @Put(":hoursId")
  @Roles("SYSTEM_ADMIN", "CHIEF_ADMIN")
  @Serializable(RestaurantHoursDto)
  @ApiOperation({ summary: "Updates restaurant hours" })
  @ApiOkResponse({
    description: "Restaurant hours have been successfully updated",
  })
  @ApiForbiddenResponse({
    description: "Forbidden, allowed only for SYSTEM_ADMIN and CHIEF_ADMIN",
  })
  async update(
    @Param("hoursId") id: number,
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
  async delete(@Param("id") id: number, @Param("hoursId") hoursId: number) {
    console.log("🚀 ~ RestaurantHoursController ~ delete ~ hoursId:", hoursId);
    console.log("🚀 ~ RestaurantHoursController ~ delete ~ id:", id);
    const result = await this.restaurantHoursService.delete(hoursId, id);
    console.log(result);
    return;
  }
}
