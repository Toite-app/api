import { RequireSessionAuth } from "src/auth/decorators/session-auth.decorator";
import { RestaurantsService } from "./restaurants.service";
import {
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { Controller } from "@core/decorators/controller.decorator";
import { Body, Get, Param, Post } from "@nestjs/common";
import { Serializable } from "@core/decorators/serializable.decorator";
import { RestaurantsPaginatedDto } from "./dto/views/get-restaurants.view";
import {
  IPagination,
  PaginationParams,
} from "@core/decorators/pagination.decorator";
import { Roles } from "@core/decorators/roles.decorator";
import { RestaurantDto } from "./dto/restaurant.dto";
import { CreateRestaurantDto } from "./dto/create-restaurant.dto";

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

  @Post()
  @Roles("SYSTEM_ADMIN", "CHIEF_ADMIN")
  @Serializable(RestaurantDto)
  @ApiOperation({
    summary: "Creates a new restaurant",
  })
  @ApiCreatedResponse({
    description: "Restaurant has been successfully created",
    type: RestaurantDto,
  })
  @ApiForbiddenResponse({
    description: "Action available only for SYSTEM_ADMIN, CHIEF_ADMIN",
  })
  async create(@Body() dto: CreateRestaurantDto): Promise<RestaurantDto> {
    return await this.restaurantsService.create(dto);
  }

  @Get(":id")
  @Serializable(RestaurantDto)
  @ApiOperation({
    summary: "Gets restaurant by id",
  })
  @ApiOkResponse({
    description: "Restaurant has been successfully fetched",
    type: RestaurantDto,
  })
  @ApiNotFoundResponse({
    description: "Restaurant with this id not found",
  })
  async findOne(@Param("id") id: number): Promise<RestaurantDto> {
    return await this.restaurantsService.findById(id);
  }
}
