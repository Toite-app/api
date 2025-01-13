import * as path from "path";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { NotFoundException } from "@core/errors/exceptions/not-found.exception";
import { ServerErrorException } from "@core/errors/exceptions/server-error.exception";
import { Injectable, Logger } from "@nestjs/common";
import { MemoryStoredFile } from "nestjs-form-data";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client;
  readonly region: string;
  readonly bucketName: string;
  readonly endpoint: string;

  private _getEnvs() {
    return {
      region: process.env.S3_REGION as string,
      accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
      endpoint: process.env.S3_ENDPOINT as string,
      bucketName: process.env.S3_BUCKET_NAME as string,
    };
  }

  constructor() {
    const { region, accessKeyId, secretAccessKey, endpoint, bucketName } =
      this._getEnvs();

    this.client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      endpoint,
      forcePathStyle: true,
    });

    this.bucketName = bucketName;
    this.region = region;
    this.endpoint = endpoint;
  }

  async uploadFile(file: MemoryStoredFile) {
    const extension = path.extname(String(file.originalName)).toLowerCase();
    const id = uuidv4();
    const key = `${id}${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimeType,
    });

    try {
      await this.client.send(command);

      return {
        id,
        extension,
        key,
      };
    } catch (error) {
      this.logger.error(error);

      try {
        // Delete file from S3 if upload failed //
        await this.client.send(
          new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
          }),
        );
      } catch (e) {}

      throw new ServerErrorException();
    }
  }

  async deleteFile(id: string, bucketName?: string) {
    // Find file first
    const findCommand = new GetObjectCommand({
      Bucket: bucketName ?? this.bucketName,
      Key: id,
    });

    const response = await this.client.send(findCommand);

    if (!response.Body) {
      throw new NotFoundException();
    }

    const command = new DeleteObjectCommand({
      Bucket: bucketName ?? this.bucketName,
      Key: id,
    });

    await this.client.send(command);
  }
}
