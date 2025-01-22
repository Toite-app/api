import { ApiProperty } from "@nestjs/swagger";
import {
  OrderDishStatusEnum,
  orderDishStatusEnum,
} from "@postgress-db/schema/order-dishes";
import { Expose } from "class-transformer";

export class KitchenOrderDishDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty({ enum: orderDishStatusEnum.enumValues })
  status: OrderDishStatusEnum;

  @Expose()
  @ApiProperty()
  quantity: number;

  @Expose()
  @ApiProperty()
  cookingTimeInMin: number;
}
