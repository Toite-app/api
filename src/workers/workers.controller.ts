import { Controller } from "@core/decorators/controller.decorator";
import {
  IPagination,
  PaginationParams,
} from "@core/decorators/pagination.decorator";
import { Body, Get, Param, Post, Put } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { Serializable } from "@core/decorators/serializable.decorator";
import { WorkersPaginatedDto } from "./dto/res/workers-paginated.dto";
import { WorkersService } from "./workers.service";
import { CreateWorkerDto, UpdateWorkerDto } from "./dto/req/put-worker.dto";
import { Roles } from "@core/decorators/roles.decorator";
import { ConflictException } from "@core/errors/exceptions/conflict.exception";
import { Worker } from "@core/decorators/worker.decorator";
import { IWorker, workerRoleRank } from "@postgress-db/schema";
import { ForbiddenException } from "@core/errors/exceptions/forbidden.exception";
import { RequireSessionAuth } from "src/auth/decorators/session-auth.decorator";
import { WorkerEntity } from "./entities/worker.entity";
import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { NotFoundException } from "@core/errors/exceptions/not-found.exception";

@RequireSessionAuth()
@Controller("workers")
@ApiForbiddenResponse({ description: "Forbidden" })
@ApiUnauthorizedResponse({ description: "Unauthorized" })
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Get()
  @ApiOperation({ summary: "Gets workers that created in system" })
  @Serializable(WorkersPaginatedDto)
  @ApiOkResponse({
    description: "Workers have been successfully fetched",
    type: WorkersPaginatedDto,
  })
  async findAll(
    @PaginationParams() pagination: IPagination,
  ): Promise<WorkersPaginatedDto> {
    const total = await this.workersService.getTotalCount();
    const data = await this.workersService.findMany({ pagination });

    return {
      data,
      meta: {
        ...pagination,
        total,
      },
    };
  }

  // TODO: add validation of ADMIN restaurant id
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
  async create(@Body() data: CreateWorkerDto, @Worker() worker: IWorker) {
    const { role } = data;

    const roleRank = workerRoleRank[role];
    const requesterRoleRank = workerRoleRank[worker.role];

    if (role === "SYSTEM_ADMIN") {
      throw new BadRequestException("You can't create system admin");
    }

    if (requesterRoleRank <= roleRank) {
      throw new ForbiddenException("You can't create worker with this role");
    }

    if (await this.workersService.findOneByLogin(data.login)) {
      throw new ConflictException("Worker with this login already exists");
    }

    return await this.workersService.create(data);
  }

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
  async findOne(@Param("id") id?: number): Promise<WorkerEntity> {
    if (!id) {
      throw new BadRequestException("Id must be a number and provided");
    }

    const worker = await this.workersService.findById(id);

    if (!worker) {
      throw new NotFoundException("Worker with this id doesn't exist");
    }

    return worker;
  }

  // TODO: add validation of ADMIN restaurant id
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
    @Param("id") id: number,
    @Body() data: UpdateWorkerDto,
    @Worker() worker: IWorker,
  ): Promise<WorkerEntity> {
    if (!id) {
      throw new BadRequestException("Id must be a number and provided");
    }

    const { role } = data;

    const roleRank = workerRoleRank?.[role];
    const requesterRoleRank = workerRoleRank[worker.role];

    if (role) {
      if (role === "SYSTEM_ADMIN") {
        throw new BadRequestException("You can't create system admin");
      }

      if (requesterRoleRank <= roleRank) {
        throw new ForbiddenException("You can't create worker with this role");
      }
    }

    if (await this.workersService.findOneByLogin(data.login)) {
      throw new ConflictException("Worker with this login already exists");
    }

    return await this.workersService.update(id, data);
  }
}
