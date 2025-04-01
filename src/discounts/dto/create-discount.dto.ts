import { IsArray, IsUUID } from "@i18n-class-validator";
import { ApiProperty, PickType } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { DiscountEntity } from "../entities/discount.entity";

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
  @IsUUID(undefined, { each: true })
  @ApiProperty({
    description: "Array of restaurant IDs where discount will be applied",
    type: [String],
    example: ["d290f1ee-6c54-4b01-90e6-d701748f0851"],
  })
  restaurantIds: string[];
}
