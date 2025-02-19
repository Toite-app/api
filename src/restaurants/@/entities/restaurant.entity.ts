import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsLatitude,
  IsOptional,
  IsString,
  IsUUID,
} from "@i18n-class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ZodCurrency } from "@postgress-db/schema/general";
import { IRestaurant } from "@postgress-db/schema/restaurants";
import { Expose } from "class-transformer";

export class RestaurantEntity implements IRestaurant {
  @IsUUID()
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the restaurant",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  id: string;

  @IsString()
  @Expose()
  @ApiProperty({
    description: "Name of the restaurant",
    example: "Stellis Pets Hall",
  })
  name: string;

  @IsOptional()
  @IsString()
  @Expose()
  @ApiProperty({
    description: "Legal entity of the restaurant",
    example: "PetsHall OÜ (reg. 12345678)",
  })
  legalEntity: string;

  @IsOptional()
  @IsString()
  @Expose()
  @ApiProperty({
    description: "Address of the restaurant",
    example: "Viru väljak, 10111 Tallinn",
  })
  address: string;

  @IsOptional()
  @IsLatitude()
  @Expose()
  @ApiProperty({
    description: "Latitude of the restaurant",
    example: "59.436962",
  })
  latitude: string;

  @IsOptional()
  @IsLatitude()
  @Expose()
  @ApiProperty({
    description: "Longitude of the restaurant",
    example: "24.753574",
  })
  longitude: string;

  @Expose()
  @IsString()
  @ApiProperty({
    description: "Timezone of the restaurant",
    example: "Europe/Tallinn",
  })
  timezone: string;

  @IsEnum(ZodCurrency.Enum)
  @Expose()
  @ApiProperty({
    description: "Currency of the restaurant",
    enum: ZodCurrency.Enum,
    example: "EUR",
  })
  currency: typeof ZodCurrency._type;

  @IsString()
  @Expose()
  @ApiProperty({
    description: "Country code of the restaurant",
    example: "EE",
  })
  countryCode: string;

  @IsBoolean()
  @Expose()
  @ApiProperty({
    description: "Is restaurant enabled",
    example: true,
  })
  isEnabled: boolean;

  @IsBoolean()
  @Expose()
  @ApiProperty({
    description: "Is restaurant closed forever",
    example: false,
  })
  isClosedForever: boolean;

  @IsOptional()
  @IsUUID()
  @Expose()
  @ApiPropertyOptional({
    description: "Owner of the restaurant",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  ownerId: string | null;

  @IsISO8601()
  @Expose()
  @ApiProperty({
    description: "Timestamp when restaurant was created",
    example: "2021-01-01T00:00:00.000Z",
  })
  createdAt: Date;

  @IsISO8601()
  @Expose()
  @ApiProperty({
    description: "Timestamp when restaurant was updated",
    example: "2021-01-01T00:00:00.000Z",
  })
  updatedAt: Date;
}
