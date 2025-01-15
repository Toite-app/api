import { Controller } from "@core/decorators/controller.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Worker } from "@core/decorators/worker.decorator";
import { Body, Delete, Param, Post, Put } from "@nestjs/common";
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
import { UpdateDishImageDto } from "./dto/update-dish-image.dto";
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

  @Put(":imageId")
  @Serializable(DishImageEntity)
  @ApiOperation({ summary: "Update dish image details" })
  @ApiOkResponse({
    description: "Image has been successfully updated",
    type: DishImageEntity,
  })
  async updateImage(
    @Param("id") dishId: string,
    @Param("imageId") imageId: string,
    @Body() dto: UpdateDishImageDto,
  ) {
    return this.dishImagesService.updateImage(dishId, imageId, {
      alt: dto.alt,
    });
  }

  @Delete(":imageId")
  @ApiOperation({ summary: "Delete an image from dish" })
  @ApiOkResponse({
    description: "Image has been successfully deleted",
  })
  async deleteImage(
    @Param("id") dishId: string,
    @Param("imageId") imageId: string,
  ) {
    await this.dishImagesService.deleteImage(dishId, imageId);
  }
}
