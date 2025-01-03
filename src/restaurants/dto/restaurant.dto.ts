import { ApiProperty } from "@nestjs/swagger";
import { IRestaurant } from "@postgress-db/schema/restaurants";
import { Expose } from "class-transformer";
import {
  IsBoolean,
  IsISO8601,
  IsLatitude,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";

export class RestaurantDto implements IRestaurant {
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

  @IsBoolean()
  @Expose()
  @ApiProperty({
    description: "Is restaurant enabled",
    example: true,
  })
  isEnabled: boolean;

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
