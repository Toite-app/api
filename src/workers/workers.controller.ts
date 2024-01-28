import { Controller } from "@core/decorators/controller.decorator";
import {
  IPagination,
  PaginationParams,
} from "@core/decorators/pagination.decorator";
import { Body, Get, Post, Put } from "@nestjs/common";
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { Serializable } from "@core/decorators/serializable.decorator";
import { WorkersPaginatedDto } from "./dto/res/workers-paginated.dto";
import { WorkersService } from "./workers.service";
import { CreateWorkerDto } from "./dto/req/put-worker.dto";
import { Roles } from "@core/decorators/roles.decorator";
import { ConflictException } from "@core/errors/exceptions/conflict.exception";
import { Worker } from "@core/decorators/worker.decorator";
import { IWorker, workerRoleRank } from "@postgress-db/schema";
import { ForbiddenException } from "@core/errors/exceptions/forbidden.exception";
import { RequireSessionAuth } from "src/auth/decorators/session-auth.decorator";
import { WorkerEntity } from "./entities/worker.entity";
import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";

@RequireSessionAuth()
@Controller("workers")
@ApiForbiddenResponse({ description: "Forbidden" })
@ApiUnauthorizedResponse({ description: "Unauthorized" })
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Get()
  @ApiOperation({ summary: "Gets all workers that created in system" })
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
  @ApiOperation({ summary: "Gets a worker by id" })
  async findOne() {
    return "This action returns a worker by id";
  }

  @Put(":id")
  @ApiOperation({ summary: "Updates a worker by id" })
  async update() {
    return "This action updates a worker by id";
  }
}
