import {
  IsBoolean,
  IsISO8601,
  IsNumber,
  IsString,
  IsUUID,
} from "@i18n-class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { IDishCategory } from "@postgress-db/schema/dish-categories";
import { Expose } from "class-transformer";

export class DishCategoryEntity implements IDishCategory {
  @Expose()
  @IsUUID()
  @ApiProperty({
    description: "Unique identifier of the dish category",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  id: string;

  @Expose()
  @IsUUID()
  @ApiProperty({
    description: "Unique identifier of the menu",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  menuId: string;

  @Expose()
  @IsString()
  @ApiProperty({
    description: "Name of the category",
    example: "Main Course",
  })
  name: string;

  @Expose()
  @IsBoolean()
  @ApiProperty({
    description: "Whether the category is visible for workers",
    example: true,
  })
  showForWorkers: boolean;

  @Expose()
  @IsBoolean()
  @ApiProperty({
    description:
      "Whether the category is visible for guests at site and in app",
    example: true,
  })
  showForGuests: boolean;

  @Expose()
  @IsNumber()
  @ApiProperty({
    description: "Sorting index in the admin menu",
    example: 1,
  })
  sortIndex: number;

  @Expose()
  @IsISO8601()
  @ApiProperty({
    description: "Date when category was created",
    example: new Date("2021-08-01T00:00:00.000Z"),
    type: Date,
  })
  createdAt: Date;

  @Expose()
  @IsISO8601()
  @ApiProperty({
    description: "Date when category was last updated",
    example: new Date("2022-03-01T05:20:52.000Z"),
    type: Date,
  })
  updatedAt: Date;
}
