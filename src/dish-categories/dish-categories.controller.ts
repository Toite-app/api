import { Controller } from "@core/decorators/controller.decorator";
import { FilterParams, IFilters } from "@core/decorators/filter.decorator";
import {
  IPagination,
  PaginationParams,
} from "@core/decorators/pagination.decorator";
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
import { EnableAuditLog } from "src/@base/audit-logs/decorators/audit-logs.decorator";

import { DishCategoriesService } from "./dish-categories.service";
import { CreateDishCategoryDto } from "./dtos/create-dish-category.dto";
import { UpdateDishCategoryDto } from "./dtos/update-dish-category.dto";
import { DishCategoriesPaginatedDto } from "./entities/dish-categories-paginated.entity";
import { DishCategoryEntity } from "./entities/dish-category.entity";

@Controller("dish-categories")
@ApiForbiddenResponse({ description: "Forbidden" })
@ApiUnauthorizedResponse({ description: "Unauthorized" })
export class DishCategoriesController {
  constructor(private readonly dishCategoriesService: DishCategoriesService) {}

  @EnableAuditLog({ onlyErrors: true })
  @Get()
  @ApiOperation({
    summary: "Gets dish categories that are available in system",
  })
  @Serializable(DishCategoriesPaginatedDto)
  @ApiOkResponse({
    description: "Dish categories have been successfully fetched",
    type: DishCategoriesPaginatedDto,
  })
  async findMany(
    @SortingParams({
      fields: [
        "id",
        "name",
        "sortIndex",
        "showForWorkers",
        "showForGuests",
        "updatedAt",
        "createdAt",
      ],
    })
    sorting: ISorting,
    @PaginationParams() pagination: IPagination,
    @FilterParams() filters?: IFilters,
  ): Promise<DishCategoriesPaginatedDto> {
    const total = await this.dishCategoriesService.getTotalCount(filters);
    const data = await this.dishCategoriesService.findMany({
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

  @EnableAuditLog()
  @Post()
  @Serializable(DishCategoryEntity)
  @ApiOperation({ summary: "Creates a new dish category" })
  @ApiCreatedResponse({
    description: "Dish category has been successfully created",
  })
  async create(
    @Body() data: CreateDishCategoryDto,
  ): Promise<DishCategoryEntity> {
    const category = await this.dishCategoriesService.create(data);

    if (!category) {
      throw new BadRequestException("Failed to create dish category");
    }

    return category;
  }

  @EnableAuditLog({ onlyErrors: true })
  @Get(":id")
  @Serializable(DishCategoryEntity)
  @ApiOperation({ summary: "Gets a dish category by id" })
  @ApiOkResponse({
    description: "Dish category has been successfully fetched",
    type: DishCategoryEntity,
  })
  @ApiNotFoundResponse({
    description: "Dish category with this id doesn't exist",
  })
  @ApiBadRequestResponse({
    description: "Id must be a string and provided",
  })
  async findOne(@Param("id") id?: string): Promise<DishCategoryEntity> {
    if (!id) {
      throw new BadRequestException("Id must be a string and provided");
    }

    const category = await this.dishCategoriesService.findById(id);

    if (!category) {
      throw new NotFoundException("Dish category with this id doesn't exist");
    }

    return category;
  }

  @EnableAuditLog()
  @Put(":id")
  @Serializable(DishCategoryEntity)
  @ApiOperation({ summary: "Updates a dish category by id" })
  @ApiOkResponse({
    description: "Dish category has been successfully updated",
    type: DishCategoryEntity,
  })
  @ApiNotFoundResponse({
    description: "Dish category with this id doesn't exist",
  })
  @ApiBadRequestResponse({
    description: "Id must be a string and provided",
  })
  async update(
    @Param("id") id: string,
    @Body() data: UpdateDishCategoryDto,
  ): Promise<DishCategoryEntity> {
    if (!id) {
      throw new BadRequestException("Id must be a string and provided");
    }

    const updatedCategory = await this.dishCategoriesService.update(id, {
      ...data,
      updatedAt: new Date(),
    });

    if (!updatedCategory) {
      throw new NotFoundException("Dish category with this id doesn't exist");
    }

    return updatedCategory;
  }
}
