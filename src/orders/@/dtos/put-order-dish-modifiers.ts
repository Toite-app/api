import { IsArray, IsString } from "@i18n-class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class PutOrderDishModifiersDto {
  @Expose()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    description: "The IDs of the dish modifiers to add to the order dish",
    example: ["123e4567-e89b-12d3-a456-426614174000"],
  })
  dishModifierIds: string[];
}
