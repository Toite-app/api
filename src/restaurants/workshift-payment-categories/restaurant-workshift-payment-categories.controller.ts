import { Controller } from "@core/decorators/controller.decorator";
import { Get, Param } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { EnableAuditLog } from "src/@base/audit-logs/decorators/audit-logs.decorator";
import { RestaurantWorkshiftPaymentCategoriesService } from "src/restaurants/workshift-payment-categories/restaurant-workshift-payment-categories.service";

@Controller("restaurants/:restaurantId/workshift-payment-categories", {
  tags: ["restaurants"],
})
export class RestaurantWorkshiftPaymentCategoriesController {
  constructor(
    private readonly restaurantWorkshiftPaymentCategoriesService: RestaurantWorkshiftPaymentCategoriesService,
  ) {}

  @EnableAuditLog({ onlyErrors: true })
  @Get()
  @ApiOperation({ summary: "Gets restaurant workshift payment categories" })
  @ApiOkResponse({
    description:
      "Restaurant workshift payment categories have been successfully fetched",
  })
  async findAll(@Param("restaurantId") restaurantId: string) {}
}
