import { RequireSessionAuth } from "src/auth/decorators/session-auth.decorator";
import { RestaurantsService } from "./restaurants.service";
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { Controller } from "@core/decorators/controller.decorator";
import { Get } from "@nestjs/common";
import { Serializable } from "@core/decorators/serializable.decorator";
import { RestaurantsPaginatedDto } from "./dto/views/get-restaurants.view";
import {
  IPagination,
  PaginationParams,
} from "@core/decorators/pagination.decorator";

@RequireSessionAuth()
@Controller("restaurants")
@ApiForbiddenResponse({ description: "Forbidden" })
@ApiUnauthorizedResponse({ description: "Unauthorized" })
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  @ApiOperation({
    summary: "Gets restaurants that created in system",
  })
  @Serializable(RestaurantsPaginatedDto)
  @ApiOkResponse({
    description: "Restaurants have been successfully fetched",
    type: RestaurantsPaginatedDto,
  })
  async findAll(@PaginationParams() pagination: IPagination) {
    const total = await this.restaurantsService.getTotalCount();
    const data = await this.restaurantsService.findMany({ pagination });

    return {
      data,
      meta: {
        ...pagination,
        total,
      },
    };
  }
}
