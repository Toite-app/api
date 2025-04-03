import { IsPhoneNumber } from "@core/decorators/is-phone.decorator";
import {
  IsBoolean,
  IsDate,
  IsDecimal,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "@i18n-class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ZodCurrency } from "@postgress-db/schema/general";
import {
  ZodOrderFromEnum,
  ZodOrderStatusEnum,
  ZodOrderTypeEnum,
} from "@postgress-db/schema/order-enums";
import { IOrder } from "@postgress-db/schema/orders";
import { Expose, Type } from "class-transformer";
import { OrderDishEntity } from "src/orders/@/entities/order-dish.entity";

export class OrderEntity implements IOrder {
  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the order",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  id: string;

  @IsUUID()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional({
    description: "Guest identifier",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  guestId: string | null;

  @IsUUID()
  @IsOptional()
  @ApiPropertyOptional({
    description: "Discounts guest identifier",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  discountsGuestId: string | null;

  @IsUUID()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional({
    description: "Restaurant identifier",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  restaurantId: string | null;

  @IsUUID()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional({
    description: "Payment method identifier",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  paymentMethodId: string | null;

  @IsString()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional({
    description: "Restaurant name",
    example: "Downtown Restaurant",
  })
  restaurantName: string | null;

  @IsString()
  @Expose()
  @ApiProperty({
    description: "Order number",
    example: "1234",
  })
  number: string;

  @IsString()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional({
    description: "Table number",
    example: "A12",
  })
  tableNumber: string | null;

  @IsEnum(ZodOrderTypeEnum.Enum)
  @Expose()
  @ApiProperty({
    description: "Order type",
    enum: ZodOrderTypeEnum.Enum,
    example: "hall",
  })
  type: typeof ZodOrderTypeEnum._type;

  @IsEnum(ZodOrderStatusEnum.Enum)
  @Expose()
  @ApiProperty({
    description: "Order status",
    enum: ZodOrderStatusEnum.Enum,
    example: "pending",
  })
  status: typeof ZodOrderStatusEnum._type;

  @IsEnum(ZodCurrency.Enum)
  @Expose()
  @ApiProperty({
    description: "Currency",
    enum: ZodCurrency.Enum,
    example: "EUR",
  })
  currency: typeof ZodCurrency._type;

  @IsEnum(ZodOrderFromEnum.Enum)
  @Expose()
  @ApiProperty({
    description: "Order from",
    enum: ZodOrderFromEnum.Enum,
    example: "hall",
  })
  from: typeof ZodOrderFromEnum._type;

  @IsString()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional({
    description: "Order note",
    example: "Please prepare without onions",
  })
  note: string | null;

  @IsString()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional({
    description: "Guest name",
    example: "John Doe",
  })
  guestName: string | null;

  @IsOptional()
  @IsPhoneNumber({
    isOptional: true,
  })
  @Expose()
  @ApiPropertyOptional({
    description: "Guest phone number",
    example: "+372 5555 5555",
  })
  guestPhone: string | null;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Expose()
  @ApiPropertyOptional({
    description: "Number of guests",
    example: 4,
  })
  guestsAmount: number | null;

  @IsDecimal()
  @Expose()
  @ApiProperty({
    description: "Subtotal amount",
    example: "100.00",
  })
  subtotal: string;

  @IsDecimal()
  @Expose()
  @ApiProperty({
    description: "Discount amount",
    example: "10.00",
  })
  discountAmount: string;

  @IsDecimal()
  @Expose()
  @ApiProperty({
    description: "Surcharge amount",
    example: "5.00",
  })
  surchargeAmount: string;

  @IsDecimal()
  @Expose()
  @ApiProperty({
    description: "Bonus points used",
    example: "0.00",
  })
  bonusUsed: string;

  @IsDecimal()
  @Expose()
  @ApiProperty({
    description: "Total amount",
    example: "95.00",
  })
  total: string;

  @IsBoolean()
  @ApiProperty({
    description: "Is discounts applied",
    example: false,
  })
  applyDiscounts: boolean;

  @IsBoolean()
  @Expose()
  @ApiProperty({
    description: "Is order hidden for guest",
    example: false,
  })
  isHiddenForGuest: boolean;

  @IsBoolean()
  @Expose()
  @ApiProperty({
    description: "Is order removed",
    example: false,
  })
  isRemoved: boolean;

  @IsBoolean()
  @Expose()
  @ApiProperty({
    description: "Is order archived",
    example: false,
  })
  isArchived: boolean;

  @Expose()
  @ApiProperty({
    description: "Order dishes",
    type: [OrderDishEntity],
  })
  @Type(() => OrderDishEntity)
  orderDishes: OrderDishEntity[];

  @IsDate()
  @Expose()
  @ApiProperty({
    description: "Date when order was created",
    example: new Date(),
  })
  createdAt: Date;

  @IsDate()
  @Expose()
  @ApiProperty({
    description: "Date when order was last updated",
    example: new Date(),
  })
  updatedAt: Date;

  @Expose()
  @IsDate()
  @IsOptional()
  @ApiPropertyOptional({
    description: "Date when order was cooking",
    example: null,
  })
  cookingAt: Date | null;

  @IsDate()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional({
    description: "Date when order was completed",
    example: null,
  })
  completedAt: Date | null;

  @IsDate()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional({
    description: "Removal timestamp",
    example: null,
  })
  removedAt: Date | null;

  @IsISO8601()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional({
    description: "Delayed to timestamp",
    example: null,
  })
  delayedTo: Date | null;
}
