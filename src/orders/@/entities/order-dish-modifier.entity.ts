import { IsString, IsUUID } from "@i18n-class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class OrderDishModifierEntity {
  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the order dish modifier",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  id: string;

  @IsString()
  @Expose()
  @ApiProperty({
    description: "Name of the order dish modifier",
    example: "Extra Cheese",
  })
  name: string;
}
