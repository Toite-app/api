import { Controller } from "@core/decorators/controller.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Get } from "@nestjs/common";
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { RequireSessionAuth } from "src/auth/decorators/session-auth.decorator";
import { TimezonesListEntity } from "src/timezones/entities/timezones-list.entity";
import { TimezonesService } from "src/timezones/timezones.service";

@RequireSessionAuth()
@Controller("timezones")
@ApiForbiddenResponse({ description: "Forbidden" })
@ApiUnauthorizedResponse({ description: "Unauthorized" })
export class TimezonesController {
  constructor(private readonly timezonesService: TimezonesService) {}

  @Get()
  @ApiOperation({
    summary: "Get list of timezones",
  })
  @Serializable(TimezonesListEntity)
  @ApiOkResponse({
    description: "Object with array of available timezones",
    type: TimezonesListEntity,
  })
  getList(): TimezonesListEntity {
    const timezones = this.timezonesService.getAllTimezones();

    return {
      timezones,
    };
  }
}
