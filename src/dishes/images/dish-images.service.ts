import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { ServerErrorException } from "@core/errors/exceptions/server-error.exception";
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

    const sortIndex = result[0].value + 1;

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

  async updateImage(
    dishId: string,
    imageId: string,
    data: {
      alt?: string;
      sortIndex?: number;
    },
  ): Promise<DishImageEntity> {
    // Get current image details
    const currentImage = await this.pg.query.dishesToImages.findFirst({
      where:
        eq(schema.dishesToImages.dishId, dishId) &&
        eq(schema.dishesToImages.imageFileId, imageId),
    });

    if (!currentImage) {
      throw new BadRequestException("Image not found");
    }

    const updateData: Record<string, unknown> = {};

    // Handle alt text update if provided
    if (data.alt !== undefined) {
      updateData.alt = data.alt;
    }

    // Handle sort index swap if provided
    if (data.sortIndex !== undefined) {
      // Find image with target sort index
      const targetImage = await this.pg.query.dishesToImages.findFirst({
        where:
          eq(schema.dishesToImages.dishId, dishId) &&
          eq(schema.dishesToImages.sortIndex, data.sortIndex),
      });

      if (!targetImage) {
        throw new BadRequestException(
          `No image found with sort index ${data.sortIndex}`,
        );
      }

      // Swap sort indexes
      await this.pg
        .update(schema.dishesToImages)
        .set({
          sortIndex: currentImage.sortIndex,
        })
        .where(
          eq(schema.dishesToImages.dishId, dishId) &&
            eq(schema.dishesToImages.imageFileId, targetImage.imageFileId),
        );

      updateData.sortIndex = data.sortIndex;
    }

    console.log(data, updateData);

    // Only update if we have changes
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException("No values to update");
    }

    // Update the current image
    const [updated] = await this.pg
      .update(schema.dishesToImages)
      .set(updateData)
      .where(
        eq(schema.dishesToImages.dishId, dishId) &&
          eq(schema.dishesToImages.imageFileId, imageId),
      )
      .returning();

    // Get the file details
    const file = await this.pg.query.files.findFirst({
      where: eq(schema.files.id, imageId),
    });

    if (!file) {
      throw new BadRequestException("File not found");
    }

    // Return the combined entity
    return {
      ...file,
      alt: updated.alt,
      sortIndex: updated.sortIndex,
    };
  }

  async deleteImage(dishId: string, imageId: string): Promise<void> {
    // First delete the relation
    const [deleted] = await this.pg
      .delete(schema.dishesToImages)
      .where(
        eq(schema.dishesToImages.dishId, dishId) &&
          eq(schema.dishesToImages.imageFileId, imageId),
      )
      .returning();

    if (!deleted) {
      throw new BadRequestException("Image not found");
    }

    try {
      // Then delete the actual file
      await this.filesService.deleteFile(imageId);
    } catch (error) {
      throw new ServerErrorException("Failed to delete file");
    }
  }
}
