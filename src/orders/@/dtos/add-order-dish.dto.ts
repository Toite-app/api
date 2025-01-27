import { IsNumber, IsUUID, Min } from "@i18n-class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class AddOrderDishDto {
  @Expose()
  @IsUUID()
  @ApiProperty({
    description: "Dish id",
    type: String,
  })
  dishId: string;

  @Expose()
  @IsNumber()
  @Min(1)
  @ApiProperty({
    description: "Quantity",
    type: Number,
  })
  quantity: number;
}
