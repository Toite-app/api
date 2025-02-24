import {
  IsArray,
  IsBoolean,
  IsDate,
  IsDecimal,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
} from "@i18n-class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IOrderDish,
  OrderDishStatusEnum,
  ZodOrderDishStatusEnum,
} from "@postgress-db/schema/order-dishes";
import { Expose, Type } from "class-transformer";
import { OrderDishModifierEntity } from "src/orders/@/entities/order-dish-modifier.entity";

export class OrderDishEntity implements IOrderDish {
  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the order dish",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  id: string;

  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Order identifier",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  orderId: string;

  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Dish identifier",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  dishId: string;

  @IsUUID()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional({
    description: "Discount identifier",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  discountId: string | null;

  @IsUUID()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional({
    description: "Surcharge identifier",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  surchargeId: string | null;

  @IsString()
  @Expose()
  @ApiProperty({
    description: "Dish name",
    example: "Caesar Salad",
  })
  name: string;

  @IsEnum(ZodOrderDishStatusEnum.Enum)
  @Expose()
  @ApiProperty({
    description: "Order dish status",
    enum: ZodOrderDishStatusEnum.Enum,
    example: "pending",
  })
  // status: typeof ZodOrderDishStatusEnum._type;
  status: OrderDishStatusEnum;

  @Expose()
  @IsArray()
  @Type(() => OrderDishModifierEntity)
  @ApiProperty({
    description: "Dish modifiers",
    example: ["d290f1ee-6c54-4b01-90e6-d701748f0851"],
  })
  modifiers: OrderDishModifierEntity[];

  @IsInt()
  @Expose()
  @ApiProperty({
    description: "Quantity ordered",
    example: 2,
  })
  quantity: number;

  @IsInt()
  @Expose()
  @ApiProperty({
    description: "Quantity returned",
    example: 0,
  })
  quantityReturned: number;

  @IsDecimal()
  @Expose()
  @ApiProperty({
    description: "Original price",
    example: "15.99",
  })
  price: string;

  @IsDecimal()
  @Expose()
  @ApiProperty({
    description: "Discount percentage",
    example: "10.00",
  })
  discountPercent: string;

  @IsDecimal()
  @Expose()
  @ApiProperty({
    description: "Discount amount",
    example: "1.59",
  })
  discountAmount: string;

  @IsDecimal()
  @Expose()
  @ApiProperty({
    description: "Surcharge percentage",
    example: "5.00",
  })
  surchargePercent: string;

  @IsDecimal()
  @Expose()
  @ApiProperty({
    description: "Surcharge amount",
    example: "0.80",
  })
  surchargeAmount: string;

  @IsDecimal()
  @Expose()
  @ApiProperty({
    description: "Final price after discounts and surcharges",
    example: "15.20",
  })
  finalPrice: string;

  @IsBoolean()
  @Expose()
  @ApiProperty({
    description: "Is order dish removed",
    example: false,
  })
  isRemoved: boolean;

  @IsBoolean()
  @Expose()
  @ApiProperty({
    description: "Is additional order",
    example: false,
  })
  isAdditional: boolean;

  @IsDate()
  @Expose()
  @ApiProperty({
    description: "Creation timestamp",
    example: new Date(),
  })
  createdAt: Date;

  @IsDate()
  @Expose()
  @ApiProperty({
    description: "Last update timestamp",
    example: new Date(),
  })
  updatedAt: Date;

  @IsDate()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional({
    description: "Removal timestamp",
    example: null,
  })
  removedAt: Date | null;
}
