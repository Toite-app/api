import { Module } from "@nestjs/common";
import { S3Service } from "src/@base/s3/s3.service";

@Module({
  imports: [],
  providers: [S3Service],
  exports: [S3Service],
})
export class S3Module {}
