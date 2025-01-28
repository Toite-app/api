import { IsNumber, Min } from "@i18n-class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class UpdateOrderDishDto {
  @Expose()
  @IsNumber()
  @Min(1)
  @ApiProperty({
    description: "Quantity",
    type: Number,
  })
  quantity: number;
}
