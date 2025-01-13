import { Inject, Injectable } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { MemoryStoredFile } from "nestjs-form-data";
import { S3Service } from "src/@base/s3/s3.service";
import { PG_CONNECTION } from "src/constants";
import { FileEntity } from "src/files/entitites/file.entity";

@Injectable()
export class FilesService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
    private readonly s3Service: S3Service,
  ) {}

  async uploadFile(
    file: MemoryStoredFile,
    options?: { uploadedByUserId?: string },
  ): Promise<FileEntity> {
    const { uploadedByUserId } = options ?? {};
    const { id, extension } = await this.s3Service.uploadFile(file);

    const dbFile = await this.pg
      .insert(schema.files)
      .values({
        id,
        originalName: file.originalName,
        mimeType: file.mimeType,
        extension,
        bucketName: this.s3Service.bucketName,
        region: this.s3Service.region,
        endpoint: this.s3Service.endpoint,
        size: file.size,
        uploadedByUserId,
      })
      .returning();

    return dbFile[0];
  }

  async deleteFile(id: string) {
    const file = await this.pg.query.files.findFirst({
      where: eq(schema.files.id, id),
    });

    await this.s3Service.deleteFile(
      `${id}${file?.extension}`,
      file?.bucketName,
    );

    if (file) {
      await this.pg.delete(schema.files).where(eq(schema.files.id, id));
    }
  }
}
