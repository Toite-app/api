import { IsArray, IsUUID } from "@i18n-class-validator";
import { ApiProperty, PickType } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { DiscountEntity } from "../entities/discount.entity";

export class CreateDiscountMenuDto {
  @Expose()
  @IsUUID()
  @ApiProperty({
    description: "Unique identifier of the menu",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  dishesMenuId: string;

  @Expose()
  @IsArray()
  @IsUUID(undefined, { each: true })
  @ApiProperty({
    description: "Array of restaurant IDs where discount will be applied",
    type: [String],
    example: ["d290f1ee-6c54-4b01-90e6-d701748f0851"],
  })
  restaurantIds: string[];

  @Expose()
  @IsArray()
  @IsUUID(undefined, { each: true })
  @ApiProperty({
    description: "Array of category IDs where discount will be applied",
    type: [String],
    example: ["d290f1ee-6c54-4b01-90e6-d701748f0851"],
  })
  categoryIds: string[];
}

export class CreateDiscountDto extends PickType(DiscountEntity, [
  "name",
  "description",
  "percent",
  "orderFroms",
  "orderTypes",
  "daysOfWeek",
  "promocode",
  "applyForFirstOrder",
  "applyByPromocode",
  "applyByDefault",
  "isEnabled",
  "startTime",
  "endTime",
  "activeFrom",
  "activeTo",
]) {
  @Expose()
  @IsArray()
  @Type(() => CreateDiscountMenuDto)
  @ApiProperty({
    description: "Array of menus where discount will be applied",
    type: [CreateDiscountMenuDto],
  })
  menus: CreateDiscountMenuDto[];
}
