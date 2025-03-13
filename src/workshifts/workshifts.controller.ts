import { Controller } from "@core/decorators/controller.decorator";
import {
  IPagination,
  PaginationParams,
} from "@core/decorators/pagination.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Worker } from "@core/decorators/worker.decorator";
import { RequestWorker } from "@core/interfaces/request";
import { Body, Get, Param, Post, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { EnableAuditLog } from "src/@base/audit-logs/decorators/audit-logs.decorator";
import { CreateWorkshiftDto } from "src/workshifts/dto/create-workshift.dto";
import { WorkshiftEntity } from "src/workshifts/entity/workshift.entity";
import { WorkshiftsPaginatedEntity } from "src/workshifts/entity/workshifts-paginated.entity";
import { WorkshiftsService } from "src/workshifts/services/workshifts.service";

import { WorkshiftNavigationEntity } from "./entity/workshift-navigation.entity";

@Controller("workshifts")
export class WorkshiftsController {
  constructor(private readonly workshiftsService: WorkshiftsService) {}

  @EnableAuditLog({ onlyErrors: true })
  @Get()
  @Serializable(WorkshiftsPaginatedEntity)
  @ApiOperation({ summary: "Get workshifts" })
  @ApiOkResponse({
    description: "Workshifts fetched successfully",
    type: WorkshiftsPaginatedEntity,
  })
  @ApiQuery({
    name: "restaurantId",
    type: String,
    required: false,
  })
  async getWorkshifts(
    @PaginationParams() pagination: IPagination,
    @Worker() worker: RequestWorker,
    @Query("restaurantId") _restaurantId?: string,
  ): Promise<WorkshiftsPaginatedEntity> {
    const restaurantId =
      _restaurantId && _restaurantId !== "null" && _restaurantId !== "undefined"
        ? _restaurantId
        : undefined;

    const total = await this.workshiftsService.getTotalCount({
      worker,
      restaurantId,
    });

    const data = await this.workshiftsService.findMany({
      worker,
      pagination,
      restaurantId,
    });

    return {
      data,
      meta: {
        ...pagination,
        total,
      },
    };
  }

  @EnableAuditLog()
  @Post()
  @Serializable(WorkshiftEntity)
  @ApiOperation({ summary: "Create workshift" })
  @ApiOkResponse({
    description: "Workshift created successfully",
    type: WorkshiftEntity,
  })
  async createWorkshift(
    @Body() payload: CreateWorkshiftDto,
    @Worker() worker: RequestWorker,
  ): Promise<WorkshiftEntity> {
    return await this.workshiftsService.create(payload, {
      worker,
    });
  }

  @EnableAuditLog()
  @Post(":workshiftId/close")
  @Serializable(WorkshiftEntity)
  @ApiOperation({ summary: "Close workshift" })
  @ApiOkResponse({
    description: "Workshift closed successfully",
    type: WorkshiftEntity,
  })
  async closeWorkshift(
    @Param("workshiftId") workshiftId: string,
    @Worker() worker: RequestWorker,
  ) {
    return await this.workshiftsService.close(workshiftId, {
      worker,
    });
  }

  @Get(":workshiftId/navigation")
  @Serializable(WorkshiftNavigationEntity)
  @ApiOperation({ summary: "Get next and previous workshift IDs" })
  @ApiOkResponse({
    description: "Navigation IDs fetched successfully",
    type: WorkshiftNavigationEntity,
  })
  async getWorkshiftNavigation(
    @Param("workshiftId") workshiftId: string,
    @Worker() worker: RequestWorker,
  ): Promise<WorkshiftNavigationEntity> {
    return await this.workshiftsService.getNavigation(workshiftId, {
      worker,
    });
  }
}
