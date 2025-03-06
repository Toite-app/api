import {
  IsArray,
  IsBoolean,
  IsISO8601,
  IsObject,
  IsString,
  IsUUID,
} from "@i18n-class-validator";
import { ApiProperty, PickType } from "@nestjs/swagger";
import { IDishesMenu } from "@postgress-db/schema/dishes-menus";
import { Expose, Type } from "class-transformer";
import { RestaurantEntity } from "src/restaurants/@/entities/restaurant.entity";
import { WorkerEntity } from "src/workers/entities/worker.entity";

export class DishesMenuRestaurantEntity extends PickType(RestaurantEntity, [
  "id",
  "name",
]) {}

export class DishesMenuOwnerEntity extends PickType(WorkerEntity, [
  "id",
  "name",
]) {}

export class DishesMenuEntity implements IDishesMenu {
  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the menu",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  id: string;

  @IsString()
  @Expose()
  @ApiProperty({
    description: "Name of the menu",
    example: "Lunch Menu",
  })
  name: string;

  @Expose()
  @IsArray()
  @Type(() => DishesMenuRestaurantEntity)
  @ApiProperty({
    description: "Restaurants that have this menu",
    type: [DishesMenuRestaurantEntity],
  })
  restaurants: DishesMenuRestaurantEntity[];

  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Owner identifier of the menu",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  ownerId: string;

  @Expose()
  @IsObject()
  @Type(() => DishesMenuOwnerEntity)
  @ApiProperty({
    description: "Owner of the menu",
    type: DishesMenuOwnerEntity,
  })
  owner: DishesMenuOwnerEntity;

  @IsBoolean()
  // @Expose()
  @ApiProperty({
    description: "Whether the menu is removed",
    example: false,
  })
  isRemoved: boolean;

  @IsISO8601()
  @Expose()
  @ApiProperty({
    description: "Date when menu was created",
    example: new Date("2024-01-01T00:00:00.000Z"),
    type: Date,
  })
  createdAt: Date;

  @IsISO8601()
  @Expose()
  @ApiProperty({
    description: "Date when menu was last updated",
    example: new Date("2024-01-01T00:00:00.000Z"),
    type: Date,
  })
  updatedAt: Date;

  @IsISO8601()
  // @Expose()
  @ApiProperty({
    description: "Date when menu was removed",
    example: new Date("2024-01-01T00:00:00.000Z"),
    type: Date,
  })
  removedAt: Date | null;
}
