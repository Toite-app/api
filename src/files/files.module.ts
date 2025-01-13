import { Module } from "@nestjs/common";
import { DrizzleModule } from "@postgress-db/drizzle.module";
import { NestjsFormDataModule } from "nestjs-form-data";
import { S3Module } from "src/@base/s3/s3.module";
import { FilesController } from "src/files/files.controller";
import { FilesService } from "src/files/files.service";

@Module({
  imports: [S3Module, DrizzleModule, NestjsFormDataModule],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
