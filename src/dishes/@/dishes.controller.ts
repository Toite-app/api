import { Controller } from "@core/decorators/controller.decorator";
import {
  FilterCondition,
  FilterParams,
  IFilters,
} from "@core/decorators/filter.decorator";
import {
  IPagination,
  PaginationParams,
} from "@core/decorators/pagination.decorator";
import SearchParam from "@core/decorators/search.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { ISorting, SortingParams } from "@core/decorators/sorting.decorator";
import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { NotFoundException } from "@core/errors/exceptions/not-found.exception";
import { Body, Get, Param, Post, Put } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { DishesService } from "./dishes.service";
import { CreateDishDto } from "./dtos/create-dish.dto";
import { UpdateDishDto } from "./dtos/update-dish.dto";
import { DishEntity } from "./entities/dish.entity";
import { DishesPaginatedDto } from "./entities/dishes-paginated.entity";

@Controller("dishes")
@ApiForbiddenResponse({ description: "Forbidden" })
@ApiUnauthorizedResponse({ description: "Unauthorized" })
export class DishesController {
  constructor(private readonly dishesService: DishesService) {}

  @Get()
  @ApiOperation({
    summary: "Gets dishes that are available in system",
  })
  @Serializable(DishesPaginatedDto)
  @ApiOkResponse({
    description: "Dishes have been successfully fetched",
    type: DishesPaginatedDto,
  })
  async findMany(
    @SortingParams({
      fields: [
        "id",
        "name",
        "cookingTimeInMin",
        "weight",
        "updatedAt",
        "createdAt",
      ],
    })
    sorting: ISorting,
    @PaginationParams() pagination: IPagination,
    @FilterParams() filters?: IFilters,
    @SearchParam() search?: string,
  ): Promise<DishesPaginatedDto> {
    if (typeof search === "string" && search.length > 0 && search !== "null") {
      if (!filters) {
        filters = { filters: [] };
      }

      filters.filters.push({
        field: "name",
        value: search,
        condition: FilterCondition.Contains,
      });
    }

    const total = await this.dishesService.getTotalCount(filters);

    const data = await this.dishesService.findMany({
      pagination,
      sorting,
      filters,
    });

    return {
      data,
      meta: {
        ...pagination,
        total,
      },
    };
  }

  @Post()
  @Serializable(DishEntity)
  @ApiOperation({ summary: "Creates a new dish" })
  @ApiCreatedResponse({ description: "Dish has been successfully created" })
  async create(@Body() data: CreateDishDto): Promise<DishEntity> {
    const dish = await this.dishesService.create(data);

    if (!dish) {
      throw new BadRequestException("errors.dishes.failed-to-create-dish");
    }

    return dish;
  }

  @Get(":id")
  @Serializable(DishEntity)
  @ApiOperation({ summary: "Gets a dish by id" })
  @ApiOkResponse({
    description: "Dish has been successfully fetched",
    type: DishEntity,
  })
  @ApiNotFoundResponse({
    description: "Dish with this id doesn't exist",
  })
  @ApiBadRequestResponse({
    description: "Id must be a string and provided",
  })
  async findOne(@Param("id") id?: string): Promise<DishEntity> {
    if (!id) {
      throw new BadRequestException(
        "errors.common.id-must-be-a-string-and-provided",
      );
    }

    const dish = await this.dishesService.findById(id);

    if (!dish) {
      throw new NotFoundException("errors.dishes.with-this-id-doesnt-exist");
    }

    return dish;
  }

  @Put(":id")
  @Serializable(DishEntity)
  @ApiOperation({ summary: "Updates a dish by id" })
  @ApiOkResponse({
    description: "Dish has been successfully updated",
    type: DishEntity,
  })
  @ApiNotFoundResponse({
    description: "Dish with this id doesn't exist",
  })
  @ApiBadRequestResponse({
    description: "Id must be a string and provided",
  })
  async update(
    @Param("id") id: string,
    @Body() data: UpdateDishDto,
  ): Promise<DishEntity> {
    if (!id) {
      throw new BadRequestException(
        "errors.common.id-must-be-a-string-and-provided",
      );
    }

    const updatedDish = await this.dishesService.update(id, {
      ...data,
      updatedAt: new Date(),
    });

    if (!updatedDish) {
      throw new NotFoundException("errors.dishes.with-this-id-doesnt-exist");
    }

    return updatedDish;
  }
}
