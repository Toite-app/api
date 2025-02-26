import { IsBoolean, IsString, IsUUID } from "@i18n-class-validator";
import { ApiProperty, IntersectionType, PickType } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { DishEntity } from "src/dishes/@/entities/dish.entity";
import { OrderDishEntity } from "src/orders/@/entities/order-dish.entity";

export class KitchenerOrderDishWorkshopEntity {
  @Expose()
  @IsUUID()
  @ApiProperty({
    description: "Workshop id",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @Expose()
  @IsString()
  @ApiProperty({
    description: "Workshop name",
    example: "Kitchen",
  })
  name: string;

  @Expose()
  @IsBoolean()
  @ApiProperty({
    description: "Is my workshop",
    example: false,
  })
  isMyWorkshop: boolean;
}

export class KitchenerOrderDishEntity extends IntersectionType(
  PickType(OrderDishEntity, [
    "id",
    "status",
    "name",
    "quantity",
    "quantityReturned",
    "isAdditional",
    "modifiers",
    "cookingAt",
    "readyAt",
  ]),
  PickType(DishEntity, ["cookingTimeInMin"]),
) {
  @Expose()
  @ApiProperty({
    description: "Workshops",
    type: [KitchenerOrderDishWorkshopEntity],
  })
  @Type(() => KitchenerOrderDishWorkshopEntity)
  workshops: KitchenerOrderDishWorkshopEntity[];

  @Expose()
  @IsBoolean()
  @ApiProperty({
    description: "Is ready in time",
    example: false,
  })
  isReadyOnTime: boolean;
}
