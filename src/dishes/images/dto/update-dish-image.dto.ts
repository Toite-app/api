import { IsString } from "@i18n-class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class UpdateDishImageDto {
  @ApiProperty({
    description: "Alternative text for the image",
    example: "Delicious pasta dish with tomato sauce",
  })
  @Expose()
  @IsString()
  alt: string;
}
