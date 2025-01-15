import { IsNumber, IsString } from "@i18n-class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { FileEntity } from "src/files/entitites/file.entity";

export class DishImageEntity extends FileEntity {
  @Expose()
  @IsString()
  @ApiProperty({
    description: "Alternative text for the image",
    example: "Image of a delicious dish",
  })
  alt: string;

  @Expose()
  @IsNumber()
  @ApiProperty({
    description: "Sort order index of the image",
    example: 0,
  })
  sortIndex: number;
}
