import { Controller } from "@core/decorators/controller.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Worker } from "@core/decorators/worker.decorator";
import { RequestWorker } from "@core/interfaces/request";
import { Body, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { EnableAuditLog } from "src/@base/audit-logs/decorators/audit-logs.decorator";
import { CreateWorkshiftPaymentCategoryDto } from "src/restaurants/workshift-payment-categories/dto/create-workshift-payment-category.dto";
import { UpdateWorkshiftPaymentCategoryDto } from "src/restaurants/workshift-payment-categories/dto/update-workshift-payment-category.dto";
import { WorkshiftPaymentCategoryEntity } from "src/restaurants/workshift-payment-categories/entity/workshift-payment-category.entity";
import { RestaurantWorkshiftPaymentCategoriesService } from "src/restaurants/workshift-payment-categories/restaurant-workshift-payment-categories.service";

@Controller("restaurants/:restaurantId/workshift-payment-categories", {
  tags: ["restaurants"],
})
export class RestaurantWorkshiftPaymentCategoriesController {
  constructor(
    private readonly restaurantWorkshiftPaymentCategoriesService: RestaurantWorkshiftPaymentCategoriesService,
  ) {}

  @EnableAuditLog({ onlyErrors: true })
  @Serializable(WorkshiftPaymentCategoryEntity)
  @Get()
  @ApiOperation({ summary: "Gets restaurant workshift payment categories" })
  @ApiOkResponse({
    description:
      "Restaurant workshift payment categories have been successfully fetched",
    type: [WorkshiftPaymentCategoryEntity],
  })
  async findAll(
    @Param("restaurantId") restaurantId: string,
    @Worker() worker: RequestWorker,
  ) {
    return this.restaurantWorkshiftPaymentCategoriesService.findAll(
      restaurantId,
      { worker },
    );
  }

  @EnableAuditLog()
  @Post()
  @ApiOperation({ summary: "Creates restaurant workshift payment category" })
  @ApiOkResponse({
    description:
      "Restaurant workshift payment category has been successfully created",
    type: WorkshiftPaymentCategoryEntity,
  })
  async create(
    @Param("restaurantId") restaurantId: string,
    @Worker() worker: RequestWorker,
    @Body() payload: CreateWorkshiftPaymentCategoryDto,
  ) {
    return this.restaurantWorkshiftPaymentCategoriesService.create(payload, {
      restaurantId,
      worker,
    });
  }

  @EnableAuditLog()
  @Patch(":categoryId")
  @ApiOperation({ summary: "Updates restaurant workshift payment category" })
  @ApiOkResponse({
    description:
      "Restaurant workshift payment category has been successfully updated",
    type: WorkshiftPaymentCategoryEntity,
  })
  async update(
    @Param("restaurantId") restaurantId: string,
    @Param("categoryId") categoryId: string,
    @Worker() worker: RequestWorker,
    @Body() payload: UpdateWorkshiftPaymentCategoryDto,
  ) {
    return this.restaurantWorkshiftPaymentCategoriesService.update(
      categoryId,
      payload,
      { worker },
    );
  }

  @EnableAuditLog()
  @Delete(":categoryId")
  @ApiOperation({ summary: "Removes restaurant workshift payment category" })
  @ApiOkResponse({
    description:
      "Restaurant workshift payment category has been successfully removed",
    type: WorkshiftPaymentCategoryEntity,
  })
  async remove(
    @Param("restaurantId") restaurantId: string,
    @Param("categoryId") categoryId: string,
    @Worker() worker: RequestWorker,
  ) {
    return this.restaurantWorkshiftPaymentCategoriesService.remove(categoryId, {
      worker,
    });
  }
}
