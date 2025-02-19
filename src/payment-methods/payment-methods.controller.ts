import { Controller } from "@core/decorators/controller.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Worker } from "@core/decorators/worker.decorator";
import { RequestWorker } from "@core/interfaces/request";
import { Body, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { EnableAuditLog } from "src/@base/audit-logs/decorators/audit-logs.decorator";
import { CreatePaymentMethodDto } from "src/payment-methods/dto/create-payment-method.dto";
import { UpdatePaymentMethodDto } from "src/payment-methods/dto/update-payment-method.dto";
import { PaymentMethodEntity } from "src/payment-methods/entities/payment-method.entity";
import { PaymentMethodsService } from "src/payment-methods/payment-methods.service";

@Controller("restaurants/:id/payment-methods", {
  tags: ["restaurants"],
})
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @EnableAuditLog({ onlyErrors: true })
  @Get()
  @Serializable(PaymentMethodEntity)
  @ApiOperation({
    summary: "Gets payment methods for a restaurant",
  })
  @ApiOkResponse({
    description: "Payment methods have been successfully fetched",
    type: [PaymentMethodEntity],
  })
  async findMany(@Param("id") restaurantId: string) {
    return await this.paymentMethodsService.findMany({
      restaurantId,
    });
  }

  @EnableAuditLog()
  @Post()
  @Serializable(PaymentMethodEntity)
  @ApiOperation({
    summary: "Creates a new payment method for a restaurant",
  })
  @ApiOkResponse({
    description: "Payment method has been successfully created",
  })
  async create(
    @Param("id") restaurantId: string,
    @Body() payload: CreatePaymentMethodDto,
    @Worker() worker: RequestWorker,
  ) {
    return await this.paymentMethodsService.create(
      {
        ...payload,
        restaurantId,
      },
      {
        worker,
      },
    );
  }

  @EnableAuditLog()
  @Patch(":paymentMethodId")
  @Serializable(PaymentMethodEntity)
  @ApiOperation({
    summary: "Updates a payment method for a restaurant",
  })
  @ApiOkResponse({
    description: "Payment method has been successfully updated",
  })
  async update(
    @Param("paymentMethodId") paymentMethodId: string,
    @Body() payload: UpdatePaymentMethodDto,
  ) {
    return await this.paymentMethodsService.update(paymentMethodId, payload);
  }
}
