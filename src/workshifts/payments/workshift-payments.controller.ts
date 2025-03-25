import { Controller } from "@core/decorators/controller.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Worker } from "@core/decorators/worker.decorator";
import { RequestWorker } from "@core/interfaces/request";
import { StringArrayPipe } from "@core/pipes/string-array.pipe";
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
    name: "types",
    isArray: true,
    enum: WorkshiftPaymentType,
    example: [
      WorkshiftPaymentType.INCOME,
      WorkshiftPaymentType.EXPENSE,
      WorkshiftPaymentType.CASHLESS,
    ],
    required: false,
  })
  async getWorkshiftPayments(
    @Param("workshiftId") workshiftId: string,
    @Worker() worker: RequestWorker,
    @Query(
      "types",
      new StringArrayPipe({
        allowedValues: Object.values(WorkshiftPaymentType),
      }),
    )
    types?: WorkshiftPaymentType[],
  ) {
    return this.workshiftPaymentsService.findMany({
      worker,
      workshiftId,
      types,
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
