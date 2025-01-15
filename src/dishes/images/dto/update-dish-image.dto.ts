import { IsNumber, IsOptional, IsString } from "@i18n-class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class UpdateDishImageDto {
  @ApiPropertyOptional({
    description: "Alternative text for the image",
    example: "Delicious pasta dish with tomato sauce",
  })
  @Expose()
  @IsOptional()
  @IsString()
  alt?: string;

  @ApiPropertyOptional({
    description: "Sort order index to swap with",
    example: 2,
  })
  @Expose()
  @IsOptional()
  @IsNumber()
  sortIndex?: number;
}
