import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsUUID,
} from "@i18n-class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ICurrency } from "@postgress-db/schema/general";
import { Expose } from "class-transformer";

export class UpdateDishPricelistDto {
  @IsNumber()
  @Expose()
  @ApiProperty({
    description: "Price of the dish",
    example: 1000,
  })
  price: number;

  @IsEnum(["EUR", "USD", "RUB"])
  @Expose()
  @ApiProperty({
    description: "Currency of the price",
    example: "EUR",
    enum: ["EUR", "USD", "RUB"],
  })
  currency: ICurrency;

  @IsBoolean()
  @Expose()
  @ApiProperty({
    description: "Whether the dish is in stoplist",
    example: false,
  })
  isInStoplist: boolean;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @Expose()
  @ApiProperty({
    description: "Array of workshop IDs to be active",
    type: [String],
    example: ["d290f1ee-6c54-4b01-90e6-d701748f0851"],
  })
  workshopIds: string[];
}
