import { IsISO8601, IsString, IsUUID } from "@i18n-class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { IDishMenu } from "@postgress-db/schema/dishes-menu";
import { Expose } from "class-transformer";

export class DishMenuEntity implements IDishMenu {
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

  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Owner identifier of the menu",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  ownerId: string;

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
}
