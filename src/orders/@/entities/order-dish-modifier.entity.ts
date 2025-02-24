import { IsString, IsUUID } from "@i18n-class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class OrderDishModifierEntity {
  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the order dish modifier",
  })
  id: string;

  @IsString()
  @Expose()
  @ApiProperty({
    description: "Name of the order dish modifier",
  })
  name: string;
}
