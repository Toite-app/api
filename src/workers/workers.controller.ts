import { Controller, Get, Post, Put } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";

@Controller("workers")
export class WorkersController {
  constructor() {}

  @Get()
  @ApiOperation({ summary: "Gets all workers that created in system" })
  async findAll() {
    return "This action returns all workers";
  }

  @Post()
  @ApiOperation({ summary: "Creates a new worker" })
  @ApiOkResponse({ description: "Worker has been successfully created" })
  async create() {
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
