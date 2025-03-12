import {
  IsBoolean,
  IsDate,
  IsInt,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from "@i18n-class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { IOrderDishReturnment } from "@postgress-db/schema/order-dishes";
import { Expose } from "class-transformer";

export class OrderDishReturnmentEntity implements IOrderDishReturnment {
  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the returnment",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  id: string;

  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Order dish identifier",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  orderDishId: string;

  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Worker identifier who processed the returnment",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  workerId: string;

  @IsInt()
  @Min(1)
  @Expose()
  @ApiProperty({
    description: "Quantity of dishes returned",
    example: 1,
  })
  quantity: number;

  @IsString()
  @MinLength(3)
  @Expose()
  @ApiProperty({
    description: "Reason for the returnment",
    example: "Food was cold",
  })
  reason: string;

  @IsBoolean()
  @Expose()
  @ApiProperty({
    description: "Whether the returnment was done after precheck",
    example: false,
  })
  isDoneAfterPrecheck: boolean;

  @IsDate()
  @Expose()
  @ApiProperty({
    description: "Date when returnment was created",
    example: new Date(),
  })
  createdAt: Date;

  @IsDate()
  @Expose()
  @ApiProperty({
    description: "Date when returnment was last updated",
    example: new Date(),
  })
  updatedAt: Date;
}
