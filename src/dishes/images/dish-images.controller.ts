import { Controller } from "@core/decorators/controller.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Worker } from "@core/decorators/worker.decorator";
import { Body, Param, Post } from "@nestjs/common";
import {
  ApiConsumes,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { IWorker } from "@postgress-db/schema/workers";
import { FormDataRequest } from "nestjs-form-data";

import { DishImageEntity } from "../@/entities/dish-image.entity";

import { DishImagesService } from "./dish-images.service";
import { UploadDishImageDto } from "./dto/upload-dish-image.dto";

@Controller("dishes/:id/images", {
  tags: ["dishes"],
})
@ApiForbiddenResponse({ description: "Forbidden" })
@ApiUnauthorizedResponse({ description: "Unauthorized" })
export class DishImagesController {
  constructor(private readonly dishImagesService: DishImagesService) {}

  @Post()
  @FormDataRequest()
  @Serializable(DishImageEntity)
  @ApiOperation({ summary: "Upload an image for a dish" })
  @ApiConsumes("multipart/form-data")
  @ApiOkResponse({
    description: "Image has been successfully uploaded",
    type: DishImageEntity,
  })
  async uploadImage(
    @Param("id") dishId: string,
    @Body() dto: UploadDishImageDto,
    @Worker() worker: IWorker,
  ) {
    return this.dishImagesService.uploadImage(dishId, dto.file, worker, {
      alt: dto.alt,
    });
  }
}
