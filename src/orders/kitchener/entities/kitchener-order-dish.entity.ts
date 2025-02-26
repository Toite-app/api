import { IsBoolean, IsString, IsUUID } from "@i18n-class-validator";
import { ApiProperty, PickType } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
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

export class KitchenerOrderDishEntity extends PickType(OrderDishEntity, [
  "id",
  "status",
  "name",
  "quantity",
  "quantityReturned",
  "isAdditional",
  "modifiers",
  "cookingAt",
  "readyAt",
]) {
  @Expose()
  @ApiProperty({
    description: "Workshops",
    type: [KitchenerOrderDishWorkshopEntity],
  })
  @Type(() => KitchenerOrderDishWorkshopEntity)
  workshops: KitchenerOrderDishWorkshopEntity[];
}
