import { Controller } from "@core/decorators/controller.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Worker } from "@core/decorators/worker.decorator";
import { RequestWorker } from "@core/interfaces/request";
import { Body, Get, Post } from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { EnableAuditLog } from "src/@base/audit-logs/decorators/audit-logs.decorator";
import { CreateDiscountDto } from "src/discounts/dto/create-discount.dto";
import { DiscountEntity } from "src/discounts/entities/discount.entity";

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
}
