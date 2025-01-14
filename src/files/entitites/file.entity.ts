import {
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from "@i18n-class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IFile } from "@postgress-db/schema/files";
import { Expose } from "class-transformer";

export class FileEntity implements IFile {
  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the file",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  id: string;

  @IsOptional()
  @IsUUID()
  @Expose()
  @ApiPropertyOptional({
    description: "Group identifier for related files",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  groupId: string | null;

  @IsString()
  @Expose()
  @ApiProperty({
    description: "Original name of the uploaded file",
    example: "menu-photo.jpg",
  })
  originalName: string;

  @IsString()
  @Expose()
  @ApiProperty({
    description: "MIME type of the file",
    example: "image/jpeg",
  })
  mimeType: string;

  @IsString()
  @Expose()
  @ApiProperty({
    description: "File extension",
    example: "jpg",
  })
  extension: string;

  @IsString()
  @Expose()
  @ApiProperty({
    description: "Name of the storage bucket",
    example: "restaurant-photos",
  })
  bucketName: string;

  @IsString()
  @Expose()
  @ApiProperty({
    description: "Storage region",
    example: "eu-central-1",
  })
  region: string;

  @IsString()
  @Expose()
  @ApiProperty({
    description: "Storage endpoint",
    example: "https://toite.hel1.your-objectstorage.com",
  })
  endpoint: string;

  @IsNumber()
  @Expose()
  @ApiProperty({
    description: "Size of the file in bytes",
    example: 1024000,
  })
  size: number;

  @IsOptional()
  @IsUUID()
  @Expose()
  @ApiPropertyOptional({
    description: "ID of the user who uploaded the file",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  uploadedByUserId: string | null;

  @IsISO8601()
  @Expose()
  @ApiProperty({
    description: "Date when file was uploaded",
    example: new Date("2024-03-01T00:00:00.000Z"),
    type: Date,
  })
  createdAt: Date;
}
