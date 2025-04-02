import { Controller } from "@core/decorators/controller.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Worker } from "@core/decorators/worker.decorator";
import { RequestWorker } from "@core/interfaces/request";
import { Body, Get, Param, Patch, Post } from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { EnableAuditLog } from "src/@base/audit-logs/decorators/audit-logs.decorator";
import { CreateDiscountDto } from "src/discounts/dto/create-discount.dto";
import {
  DiscountEntity,
  DiscountFullEntity,
} from "src/discounts/entities/discount.entity";

import { UpdateDiscountDto } from "./dto/update-discount.dto";
import { DiscountsService } from "./services/discounts.service";

@Controller("discounts")
@ApiForbiddenResponse({ description: "Forbidden" })
@ApiUnauthorizedResponse({ description: "Unauthorized" })
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @EnableAuditLog({ onlyErrors: true })
  @Get()
  @ApiOperation({
    summary: "Get all discounts",
  })
  @ApiOkResponse({
    description: "Discounts have been successfully fetched",
    type: DiscountEntity,
  })
  async findAll(@Worker() worker: RequestWorker) {
    return this.discountsService.findMany({ worker });
  }

  @EnableAuditLog()
  @Get(":id")
  @Serializable(DiscountFullEntity)
  @ApiOperation({
    summary: "Get a discount by id",
    description: "Get a discount by id",
  })
  @ApiOkResponse({
    description: "Discount has been successfully fetched",
    type: DiscountFullEntity,
  })
  async findOne(@Param("id") id: string, @Worker() worker: RequestWorker) {
    return this.discountsService.findOne(id, { worker });
  }

  @EnableAuditLog()
  @Post()
  @Serializable(DiscountEntity)
  @ApiOperation({
    summary: "Create a new discount",
  })
  @ApiCreatedResponse({
    description: "Discount has been successfully created",
    type: DiscountEntity,
  })
  async create(
    @Body() payload: CreateDiscountDto,
    @Worker() worker: RequestWorker,
  ) {
    return this.discountsService.create(payload, {
      worker,
    });
  }

  @EnableAuditLog()
  @Patch(":id")
  @Serializable(DiscountEntity)
  @ApiOperation({
    summary: "Update an existing discount",
  })
  @ApiOkResponse({
    description: "Discount has been successfully updated",
    type: DiscountEntity,
  })
  async update(
    @Param("id") id: string,
    @Body() payload: UpdateDiscountDto,
    @Worker() worker: RequestWorker,
  ) {
    return this.discountsService.update(id, payload, {
      worker,
    });
  }
}
