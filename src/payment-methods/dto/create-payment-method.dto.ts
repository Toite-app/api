import { IsOptional, IsString } from "@i18n-class-validator";
import {
  ApiPropertyOptional,
  IntersectionType,
  PartialType,
  PickType,
} from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { PaymentMethodEntity } from "src/payment-methods/entities/payment-method.entity";

export class CreatePaymentMethodDto extends IntersectionType(
  PickType(PaymentMethodEntity, ["name", "type", "icon"]),
  PartialType(PickType(PaymentMethodEntity, ["secretId", "isActive"])),
) {
  @Expose()
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: "Secret key for payment integration",
    example: "live_secretKey",
  })
  secretKey: string | null;

  restaurantId: string;
}
