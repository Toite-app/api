import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
} from "@i18n-class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IPaymentMethod,
  paymentMethodIconEnum,
  paymentMethodTypeEnum,
} from "@postgress-db/schema/payment-methods";
import { Expose } from "class-transformer";

export class PaymentMethodEntity implements Omit<IPaymentMethod, "secretKey"> {
  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the payment method",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  id: string;

  @IsString()
  @Expose()
  @ApiProperty({
    description: "Name of the payment method",
    example: "Yoo Kassa",
  })
  name: string;

  @IsEnum(paymentMethodTypeEnum.enumValues)
  @Expose()
  @ApiProperty({
    description: "Type of the payment method",
    enum: paymentMethodTypeEnum.enumValues,
    example: "YOO_KASSA",
  })
  type: (typeof paymentMethodTypeEnum.enumValues)[number];

  @IsEnum(paymentMethodIconEnum.enumValues)
  @Expose()
  @ApiProperty({
    description: "Icon type for the payment method",
    enum: paymentMethodIconEnum.enumValues,
    example: "YOO_KASSA",
  })
  icon: (typeof paymentMethodIconEnum.enumValues)[number];

  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "ID of the restaurant this payment method belongs to",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  restaurantId: string;

  @IsOptional()
  @IsString()
  @Expose()
  @ApiPropertyOptional({
    description: "Secret ID for payment integration",
    example: "live_secretId",
  })
  secretId: string | null;

  @IsBoolean()
  @Expose()
  @ApiProperty({
    description: "Whether the payment method is active",
    example: true,
  })
  isActive: boolean;

  @IsBoolean()
  @Expose()
  @ApiProperty({
    description: "Whether the payment method is removed",
    example: false,
  })
  isRemoved: boolean;

  @IsISO8601()
  @Expose()
  @ApiProperty({
    description: "Date when payment method was created",
    example: new Date().toISOString(),
    type: Date,
  })
  createdAt: Date;

  @IsISO8601()
  @Expose()
  @ApiProperty({
    description: "Date when payment method was last updated",
    example: new Date().toISOString(),
    type: Date,
  })
  updatedAt: Date;

  @IsOptional()
  @IsISO8601()
  @Expose()
  @ApiPropertyOptional({
    description: "Date when payment method was removed",
    example: null,
    type: Date,
  })
  removedAt: Date | null;
}
