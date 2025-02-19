import { Controller } from "@core/decorators/controller.decorator";
import { FilterParams, IFilters } from "@core/decorators/filter.decorator";
import {
  IPagination,
  PaginationParams,
} from "@core/decorators/pagination.decorator";
import { Roles } from "@core/decorators/roles.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { ISorting, SortingParams } from "@core/decorators/sorting.decorator";
import { Worker } from "@core/decorators/worker.decorator";
import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { ForbiddenException } from "@core/errors/exceptions/forbidden.exception";
import { NotFoundException } from "@core/errors/exceptions/not-found.exception";
import { RequestWorker } from "@core/interfaces/request";
import { Body, Get, Param, Post, Put, Query } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import {
  IWorker,
  WorkerRole,
  workerRoleRank,
} from "@postgress-db/schema/workers";
import { EnableAuditLog } from "src/@base/audit-logs/decorators/audit-logs.decorator";

import { CreateWorkerDto, UpdateWorkerDto } from "./dto/req/put-worker.dto";
import { WorkersPaginatedDto } from "./dto/res/workers-paginated.dto";
import { WorkerEntity } from "./entities/worker.entity";
import { WorkersService } from "./workers.service";

@Controller("workers")
@ApiForbiddenResponse({ description: "Forbidden" })
@ApiUnauthorizedResponse({ description: "Unauthorized" })
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @EnableAuditLog({ onlyErrors: true })
  @Get()
  @ApiOperation({ summary: "Gets workers that created in system" })
  @ApiQuery({
    name: "restaurantIds",
    type: String,
    required: false,
    description: "Comma separated list of restaurant IDs to filter workers by",
    example: "['1', '2', '3']",
  })
  @Serializable(WorkersPaginatedDto)
  @ApiOkResponse({
    description: "Workers have been successfully fetched",
    type: WorkersPaginatedDto,
  })
  async findAll(
    @SortingParams({
      fields: [
        "id",
        "name",
        "login",
        "role",
        "onlineAt",
        "updatedAt",
        "createdAt",
      ],
    })
    sorting: ISorting,
    @PaginationParams() pagination: IPagination,
    @FilterParams() filters?: IFilters,
    @Query("restaurantIds") restaurantIds?: string,
  ): Promise<WorkersPaginatedDto> {
    const parsedRestaurantIds =
      restaurantIds !== "undefined" ? restaurantIds?.split(",") : undefined;

    const total = await this.workersService.getTotalCount(
      filters,
      parsedRestaurantIds,
    );

    const data = await this.workersService.findMany({
      pagination,
      sorting,
      filters,
      restaurantIds: parsedRestaurantIds,
    });

    return {
      data,
      meta: {
        ...pagination,
        total,
      },
    };
  }

  // TODO: add validation of ADMIN restaurant id
  @EnableAuditLog()
  @Post()
  @Roles("SYSTEM_ADMIN", "CHIEF_ADMIN", "ADMIN")
  @Serializable(WorkerEntity)
  @ApiOperation({ summary: "Creates a new worker" })
  @ApiCreatedResponse({ description: "Worker has been successfully created" })
  @ApiConflictResponse({ description: "Worker with this login already exists" })
  @ApiForbiddenResponse({
    description:
      "Available only for SYSTEM_ADMIN, CHIEF_ADMIN, ADMIN (restaurant scope)",
  })
  async create(@Body() data: CreateWorkerDto, @Worker() worker: RequestWorker) {
    const { role } = data;

    const roleRank = workerRoleRank[role];
    const requesterRoleRank = workerRoleRank[worker.role];

    if (role === "SYSTEM_ADMIN") {
      throw new ForbiddenException("errors.workers.cant-create-system-admin", {
        property: "role",
      });
    }

    if (requesterRoleRank <= roleRank) {
      throw new ForbiddenException(
        "errors.workers.not-enough-rights-to-create-worker-with-this-role",
        {
          property: "role",
        },
      );
    }

    return await this.workersService.create(data, { worker });
  }

  @EnableAuditLog({ onlyErrors: true })
  @Get(":id")
  @Serializable(WorkerEntity)
  @ApiOperation({ summary: "Gets a worker by id" })
  @ApiOkResponse({
    description: "Worker has been successfully fetched",
    type: WorkerEntity,
  })
  @ApiNotFoundResponse({
    description: "Worker with this id doesn't exist",
  })
  @ApiBadRequestResponse({
    description: "Id must be a number and provided",
  })
  async findOne(@Param("id") id?: string): Promise<WorkerEntity> {
    if (!id) {
      throw new BadRequestException(
        "errors.common.id-must-be-a-string-and-provided",
      );
    }

    const worker = await this.workersService.findById(id);

    if (!worker) {
      throw new NotFoundException("errors.workers.with-this-id-doesnt-exist");
    }

    return worker;
  }

  // TODO: add validation of ADMIN restaurant id
  @EnableAuditLog()
  @Put(":id")
  @Roles("SYSTEM_ADMIN", "CHIEF_ADMIN", "ADMIN")
  @Serializable(WorkerEntity)
  @ApiOperation({ summary: "Updates a worker by id" })
  @ApiOkResponse({
    description: "Worker has been successfully updated",
    type: WorkerEntity,
  })
  @ApiNotFoundResponse({
    description: "Worker with this id doesn't exist",
  })
  @ApiBadRequestResponse({
    description: "Id must be a number and provided",
  })
  async update(
    @Param("id") id: string,
    @Body() data: UpdateWorkerDto,
    @Worker() worker: IWorker,
  ): Promise<WorkerEntity> {
    if (!id) {
      throw new BadRequestException(
        "errors.common.id-must-be-a-string-and-provided",
      );
    }

    const { role } = data;

    const roleRank = workerRoleRank?.[role as WorkerRole];
    const requesterRoleRank = workerRoleRank[worker.role];

    if (role) {
      if (role === "SYSTEM_ADMIN") {
        throw new ForbiddenException(
          "errors.workers.cant-create-system-admin",
          {
            property: "role",
          },
        );
      }

      if (requesterRoleRank <= roleRank) {
        throw new ForbiddenException(
          "errors.workers.not-enough-rights-to-create-worker-with-this-role",
          {
            property: "role",
          },
        );
      }
    }

    const updatedWorker = await this.workersService.update(id, {
      ...data,
      updatedAt: new Date(),
    });

    if (!updatedWorker) {
      throw new NotFoundException("errors.workers.with-this-id-doesnt-exist");
    }

    return updatedWorker;
  }
}
