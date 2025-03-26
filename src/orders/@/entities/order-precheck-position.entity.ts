import { IsDecimal, IsInt, IsString, IsUUID } from "@i18n-class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { IOrderPrecheckPosition } from "@postgress-db/schema/order-prechecks";
import { Expose } from "class-transformer";

export class OrderPrecheckPositionEntity implements IOrderPrecheckPosition {
  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the precheck position",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  id: string;

  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Precheck identifier",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  precheckId: string;

  @IsString()
  @Expose()
  @ApiProperty({
    description: "Position name",
    example: "Burger",
  })
  name: string;

  @IsInt()
  @Expose()
  @ApiProperty({
    description: "Quantity",
    example: 2,
  })
  quantity: number;

  @IsDecimal()
  @Expose()
  @ApiProperty({
    description: "Price per unit",
    example: "10.00",
  })
  price: string;

  @IsDecimal()
  @Expose()
  @ApiProperty({
    description: "Discount amount",
    example: "1.00",
  })
  discountAmount: string;

  @IsDecimal()
  @Expose()
  @ApiProperty({
    description: "Surcharge amount",
    example: "0.50",
  })
  surchargeAmount: string;

  @IsDecimal()
  @Expose()
  @ApiProperty({
    description: "Final price after discounts and surcharges",
    example: "9.50",
  })
  finalPrice: string;
}
