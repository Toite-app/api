import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Transform } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

import { AddressProvider } from "../entities/suggestion.entity";

export class GetSuggestionsDto {
  @Expose()
  @ApiProperty({
    description: "Search query for address suggestions",
    example: "Moscow, Tverskaya",
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  query: string;

  @Expose()
  @ApiProperty({
    description: "Preferred provider for address suggestions",
    enum: ["dadata", "google"],
    default: "dadata",
    required: false,
  })
  @IsEnum(["dadata", "google"] as const)
  @IsOptional()
  provider?: AddressProvider;

  @Expose()
  @ApiPropertyOptional()
  @ApiProperty({
    description: "Response language (ISO 639-1)",
    example: "ru",
    default: "ru",
    required: false,
  })
  @IsString()
  @IsOptional()
  language?: string;

  @Expose()
  @ApiPropertyOptional()
  @ApiProperty({
    description: "Include raw provider response in the result",
    example: false,
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  includeRaw?: boolean;
}
