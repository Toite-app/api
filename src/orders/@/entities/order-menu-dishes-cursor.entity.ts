import { CursorResponseDto } from "@core/dto/cursor-response.entity";
import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { OrderMenuDishEntity } from "src/orders/@/entities/order-menu-dish.entity";

export class OrderMenuDishesCursorEntity extends CursorResponseDto {
  @Expose()
  @ApiProperty({
    description: "Array of dishes",
    type: [OrderMenuDishEntity],
  })
  @Type(() => OrderMenuDishEntity)
  data: OrderMenuDishEntity[];
}
