import { Controller } from "@core/decorators/controller.decorator";
import { Serializable } from "@core/decorators/serializable.decorator";
import { Worker } from "@core/decorators/worker.decorator";
import { Body, Delete, Param, Post } from "@nestjs/common";
import {
  ApiConsumes,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { IWorker } from "@postgress-db/schema/workers";
import { FormDataRequest } from "nestjs-form-data";
import { RequireSessionAuth } from "src/auth/decorators/session-auth.decorator";
import { UploadFormDataDto } from "src/files/dto/upload-form-data.dto";
import { FileEntity } from "src/files/entitites/file.entity";
import { FilesService } from "src/files/files.service";

@RequireSessionAuth()
@Controller("files")
@ApiForbiddenResponse({ description: "Forbidden" })
@ApiUnauthorizedResponse({ description: "Unauthorized" })
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post("upload")
  @FormDataRequest()
  @Serializable(FileEntity)
  @ApiOperation({ summary: "Uploads a file" })
  @ApiConsumes("multipart/form-data")
  @ApiOkResponse({
    description: "File has been successfully uploaded",
    type: FileEntity,
  })
  async uploadFile(@Body() dto: UploadFormDataDto, @Worker() worker: IWorker) {
    return this.filesService.uploadFile(dto.file, {
      uploadedByUserId: worker.id,
    });
  }

  @Delete(":id")
  @ApiOperation({ summary: "Deletes a file" })
  @ApiOkResponse({
    description: "File has been successfully deleted",
  })
  async deleteFile(@Param("id") id: string) {
    return this.filesService.deleteFile(id);
  }
}
