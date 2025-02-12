import { Controller } from "@core/decorators/controller.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Get, Query } from "@nestjs/common";
import {
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { EnableAuditLog } from "src/@base/audit-logs/decorators/audit-logs.decorator";

import { GetSuggestionsDto } from "./dto/get-suggestions.dto";
import { AddressSuggestion } from "./entities/suggestion.entity";
import { AddressesService } from "./services/addresses.service";

@Controller("addresses")
@ApiForbiddenResponse({ description: "Forbidden" })
@ApiUnauthorizedResponse({ description: "Unauthorized" })
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @EnableAuditLog({ onlyErrors: true })
  @Get("suggestions")
  @ApiOperation({
    summary: "Get address suggestions",
    description:
      "Returns address suggestions based on the search query. Supports multiple providers (Dadata and Google) and different languages.",
  })
  @Serializable(AddressSuggestion)
  @ApiResponse({
    status: 200,
    description: "Returns array of address suggestions",
    type: AddressSuggestion,
    isArray: true,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input parameters",
  })
  async getSuggestions(
    @Query() { query, provider, language, includeRaw }: GetSuggestionsDto,
  ): Promise<AddressSuggestion[]> {
    return this.addressesService.getSuggestions(
      query,
      provider,
      language,
      includeRaw,
    );
  }
}
