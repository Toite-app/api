import { Controller } from "@core/decorators/controller.decorator";
import { FilterParams, IFilters } from "@core/decorators/filter.decorator";
import {
  IPagination,
  PaginationParams,
} from "@core/decorators/pagination.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { ISorting, SortingParams } from "@core/decorators/sorting.decorator";
import { Get } from "@nestjs/common";
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { RequireSessionAuth } from "src/auth/decorators/session-auth.decorator";
import { GuestsPaginatedDto } from "src/guests/entities/guests-paginated.entity";
import { GuestsService } from "src/guests/guests.service";

@RequireSessionAuth()
@Controller("guests")
@ApiForbiddenResponse({ description: "Forbidden" })
@ApiUnauthorizedResponse({ description: "Unauthorized" })
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

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
      fields: ["id", "name", "updatedAt", "createdAt"],
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
}
