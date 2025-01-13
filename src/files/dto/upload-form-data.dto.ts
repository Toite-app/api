import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import {
  HasMimeType,
  IsFile,
  MaxFileSize,
  MemoryStoredFile,
} from "nestjs-form-data";

export class UploadFormDataDto {
  @ApiProperty({
    type: "file",
    description: "Image file to upload (JPEG, PNG, JPG). Max size: 2MB",
    required: true,
  })
  @Expose()
  @IsFile()
  @MaxFileSize(2e6)
  @HasMimeType(["image/jpeg", "image/png", "image/jpg"])
  file: MemoryStoredFile;
}
