import { Module } from "@nestjs/common";
import { DrizzleModule } from "@postgress-db/drizzle.module";
import { NestjsFormDataModule } from "nestjs-form-data";
import { FilesModule } from "src/files/files.module";

import { DishesController } from "./@/dishes.controller";
import { DishesService } from "./@/dishes.service";
import { DishImagesController } from "./images/dish-images.controller";
import { DishImagesService } from "./images/dish-images.service";
import { DishPricelistController } from "./pricelist/dish-pricelist.controller";
import { DishPricelistService } from "./pricelist/dish-pricelist.service";

@Module({
  imports: [DrizzleModule, FilesModule, NestjsFormDataModule],
  controllers: [
    DishesController,
    DishImagesController,
    DishPricelistController,
  ],
  providers: [DishesService, DishImagesService, DishPricelistService],
  exports: [DishesService, DishImagesService, DishPricelistService],
})
export class DishesModule {}
