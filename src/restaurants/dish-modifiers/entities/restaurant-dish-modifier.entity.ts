import {
  IsBoolean,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
} from "@i18n-class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IDishModifier } from "@postgress-db/schema/dish-modifiers";
import { Expose } from "class-transformer";

export class RestaurantDishModifierEntity implements IDishModifier {
  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the dish modifier",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  id: string;

  @IsString()
  @Expose()
  @ApiProperty({
    description: "Name of the dish modifier",
    example: "Extra Cheese",
  })
  name: string;

  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the restaurant",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  restaurantId: string;

  @IsBoolean()
  @Expose()
  @ApiProperty({
    description: "Is the modifier active",
    example: true,
  })
  isActive: boolean;

  @IsBoolean()
  @Expose()
  @ApiProperty({
    description: "Is the modifier removed",
    example: false,
  })
  isRemoved: boolean;

  @IsISO8601()
  @Expose()
  @ApiProperty({
    description: "Timestamp of creation",
    example: "2024-01-01T00:00:00.000Z",
  })
  createdAt: Date;

  @IsISO8601()
  @Expose()
  @ApiProperty({
    description: "Timestamp of last update",
    example: "2024-01-01T00:00:00.000Z",
  })
  updatedAt: Date;

  @IsOptional()
  @IsISO8601()
  @Expose()
  @ApiPropertyOptional({
    description: "Timestamp when modifier was removed",
    example: "2024-01-01T00:00:00.000Z",
  })
  removedAt: Date | null;
}
