import { Controller } from "@core/decorators/controller.decorator";
import {
  IPagination,
  PaginationParams,
} from "@core/decorators/pagination.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Worker } from "@core/decorators/worker.decorator";
import { RequestWorker } from "@core/interfaces/request";
import { Body, Get, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { EnableAuditLog } from "src/@base/audit-logs/decorators/audit-logs.decorator";
import { CreateWorkshiftDto } from "src/workshifts/dto/create-workshift.dto";
import { WorkshiftEntity } from "src/workshifts/entity/workshift.entity";
import { WorkshiftsPaginatedEntity } from "src/workshifts/entity/workshifts-paginated.entity";
import { WorkshiftsService } from "src/workshifts/services/workshifts.service";

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
  async getWorkshifts(
    @PaginationParams() pagination: IPagination,
    @Worker() worker: RequestWorker,
  ): Promise<WorkshiftsPaginatedEntity> {
    const total = await this.workshiftsService.getTotalCount({
      worker,
    });

    const data = await this.workshiftsService.findMany({
      worker,
      pagination,
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
}
