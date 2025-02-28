import { Controller } from "@core/decorators/controller.decorator";
import { Worker } from "@core/decorators/worker.decorator";
import { RequestWorker } from "@core/interfaces/request";
import { Get } from "@nestjs/common";
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { EnableAuditLog } from "src/@base/audit-logs/decorators/audit-logs.decorator";
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
}
