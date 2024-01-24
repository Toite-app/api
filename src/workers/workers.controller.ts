import { Controller } from "@core/decorators/controller.decorator";
import {
  IPagination,
  PaginationParams,
} from "@core/decorators/pagination.decorator";
import { Body, Get, Post, Put, UseGuards } from "@nestjs/common";
import {
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { SessionAuthGuard } from "src/auth/guards/session-auth.guard";
import { Serializable } from "@core/decorators/serializable.decorator";
import { WorkersPaginatedDto } from "./dto/res/workers-paginated.dto";
import { WorkersService } from "./workers.service";
import { PutWorkerDto } from "./dto/req/put-worker.dto";

@UseGuards(SessionAuthGuard)
@ApiUnauthorizedResponse({ description: "Unauthorized" })
@Controller("workers")
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

  @Post()
  @ApiOperation({ summary: "Creates a new worker" })
  @ApiOkResponse({ description: "Worker has been successfully created" })
  async create(@Body() data: PutWorkerDto) {
    return "This action adds a new worker";
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
