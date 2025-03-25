import { Controller } from "@core/decorators/controller.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Worker } from "@core/decorators/worker.decorator";
import { RequestWorker } from "@core/interfaces/request";
import { StringValuePipe } from "@core/pipes/string.pipe";
import { Body, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { WorkshiftPaymentType } from "@postgress-db/schema/workshift-payments";
import { EnableAuditLog } from "src/@base/audit-logs/decorators/audit-logs.decorator";
import { CreateWorkshiftPaymentDto } from "src/workshifts/payments/dto/create-workshift-payment.dto";
import { WorkshiftPaymentEntity } from "src/workshifts/payments/entity/workshift-payment.entity";
import { WorkshiftPaymentsService } from "src/workshifts/payments/services/workshift-payments.service";

@Controller("workshifts/:workshiftId/payments", {
  tags: ["workshifts"],
})
export class WorkshiftPaymentsController {
  constructor(
    private readonly workshiftPaymentsService: WorkshiftPaymentsService,
  ) {}

  @EnableAuditLog({ onlyErrors: true })
  @Get()
  @Serializable(WorkshiftPaymentEntity)
  @ApiOperation({ summary: "Get workshift payments" })
  @ApiOkResponse({
    description: "Workshift payments retrieved successfully",
    type: [WorkshiftPaymentEntity],
  })
  @ApiQuery({
    name: "type",
    enum: WorkshiftPaymentType,
    required: false,
  })
  async getWorkshiftPayments(
    @Param("workshiftId") workshiftId: string,
    @Worker() worker: RequestWorker,
    @Query(
      "type",
      new StringValuePipe({
        allowedValues: Object.values(WorkshiftPaymentType),
      }),
    )
    type?: WorkshiftPaymentType,
  ) {
    return this.workshiftPaymentsService.findMany({
      worker,
      workshiftId,
      type,
    });
  }

  @EnableAuditLog()
  @Post()
  @Serializable(WorkshiftPaymentEntity)
  @ApiOperation({ summary: "Create workshift payment" })
  @ApiOkResponse({
    description: "Workshift payment created successfully",
    type: WorkshiftPaymentEntity,
  })
  async createWorkshiftPayment(
    @Param("workshiftId") workshiftId: string,
    @Worker() worker: RequestWorker,
    @Body() payload: CreateWorkshiftPaymentDto,
  ) {
    return this.workshiftPaymentsService.create(
      {
        ...payload,
        workshiftId,
      },
      { worker },
    );
  }

  @EnableAuditLog()
  @Delete(":paymentId")
  @ApiOperation({ summary: "Delete workshift payment" })
  @ApiOkResponse({
    description: "Workshift payment deleted successfully",
  })
  async deleteWorkshiftPayment(
    @Param("workshiftId") workshiftId: string,
    @Param("paymentId") paymentId: string,
    @Worker() worker: RequestWorker,
  ) {
    return this.workshiftPaymentsService.remove(paymentId, {
      worker,
    });
  }
}
