import { Inject, Injectable } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import { IWorker } from "@postgress-db/schema/workers";
import { count, eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { MemoryStoredFile } from "nestjs-form-data";
import { PG_CONNECTION } from "src/constants";
import { FilesService } from "src/files/files.service";

import { DishImageEntity } from "../@/entities/dish-image.entity";

@Injectable()
export class DishImagesService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
    private readonly filesService: FilesService,
  ) {}

  async uploadImage(
    dishId: string,
    file: MemoryStoredFile,
    worker: IWorker,
    options?: {
      alt?: string;
    },
  ): Promise<DishImageEntity> {
    // Get the next sort index
    const result = await this.pg
      .select({
        value: count(),
      })
      .from(schema.dishesToImages)
      .where(eq(schema.dishesToImages.dishId, dishId));

    const sortIndex = result[0].value;

    // Upload the file first
    const uploadedFile = await this.filesService.uploadFile(file, {
      uploadedByUserId: worker.id,
    });

    // Create the dish-to-image relation
    await this.pg.insert(schema.dishesToImages).values({
      dishId,
      imageFileId: uploadedFile.id,
      alt: options?.alt ?? "",
      sortIndex,
    });

    // Return the combined entity
    return {
      ...uploadedFile,
      alt: options?.alt ?? "",
      sortIndex,
    };
  }
}
