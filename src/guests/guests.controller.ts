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

import { CreateGuestDto } from "./dtos/create-guest.dto";
import { UpdateGuestDto } from "./dtos/update-guest.dto";
import { GuestEntity } from "./entities/guest.entity";
import { GuestsPaginatedDto } from "./entities/guests-paginated.entity";
import { GuestsService } from "./guests.service";

@Controller("guests")
@ApiForbiddenResponse({ description: "Forbidden" })
@ApiUnauthorizedResponse({ description: "Unauthorized" })
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @EnableAuditLog({ onlyErrors: true })
  @Get()
  @ApiOperation({
    summary: "Gets guests that available in system",
  })
  @Serializable(GuestsPaginatedDto)
  @ApiOkResponse({
    description: "Guests have been successfully fetched",
    type: GuestsPaginatedDto,
  })
  async findMany(
    @SortingParams({
      fields: [
        "id",
        "name",
        "phone",
        "email",
        "bonusBalance",
        "updatedAt",
        "createdAt",
        "lastVisitAt",
      ],
    })
    sorting: ISorting,
    @PaginationParams() pagination: IPagination,
    @FilterParams() filters?: IFilters,
  ): Promise<GuestsPaginatedDto> {
    const total = await this.guestsService.getTotalCount(filters);
    const data = await this.guestsService.findMany({
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
  @Serializable(GuestEntity)
  @ApiOperation({ summary: "Creates a new guest" })
  @ApiCreatedResponse({ description: "Guest has been successfully created" })
  async create(@Body() data: CreateGuestDto): Promise<GuestEntity> {
    const guest = await this.guestsService.create(data);

    if (!guest) {
      throw new BadRequestException("errors.guests.failed-to-create-guest");
    }

    return guest;
  }

  @EnableAuditLog({ onlyErrors: true })
  @Get(":id")
  @Serializable(GuestEntity)
  @ApiOperation({ summary: "Gets a guest by id" })
  @ApiOkResponse({
    description: "Guest has been successfully fetched",
    type: GuestEntity,
  })
  @ApiNotFoundResponse({
    description: "Guest with this id doesn't exist",
  })
  @ApiBadRequestResponse({
    description: "Id must be a string and provided",
  })
  async findOne(@Param("id") id?: string): Promise<GuestEntity> {
    if (!id) {
      throw new BadRequestException(
        "errors.common.id-must-be-a-string-and-provided",
      );
    }

    const guest = await this.guestsService.findById(id);

    if (!guest) {
      throw new NotFoundException("errors.guests.with-this-id-doesnt-exist");
    }

    return guest;
  }

  @EnableAuditLog()
  @Put(":id")
  @Serializable(GuestEntity)
  @ApiOperation({ summary: "Updates a guest by id" })
  @ApiOkResponse({
    description: "Guest has been successfully updated",
    type: GuestEntity,
  })
  @ApiNotFoundResponse({
    description: "Guest with this id doesn't exist",
  })
  @ApiBadRequestResponse({
    description: "Id must be a string and provided",
  })
  async update(
    @Param("id") id: string,
    @Body() data: UpdateGuestDto,
  ): Promise<GuestEntity> {
    if (!id) {
      throw new BadRequestException(
        "errors.common.id-must-be-a-string-and-provided",
      );
    }

    const updatedGuest = await this.guestsService.update(id, {
      ...data,
      updatedAt: new Date(),
    });

    if (!updatedGuest) {
      throw new NotFoundException("errors.guests.with-this-id-doesnt-exist");
    }

    return updatedGuest;
  }
}
