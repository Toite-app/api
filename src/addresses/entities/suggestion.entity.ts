import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsOptional } from "class-validator";

export interface IGoogleRawResult {
  address_components: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    location_type: string;
    viewport: {
      northeast: {
        lat: number;
        lng: number;
      };
      southwest: {
        lat: number;
        lng: number;
      };
    };
  };
  place_id: string;
  types: string[];
}

export interface IDadataRawResult {
  value: string;
  unrestricted_value: string;
  data: {
    postal_code: string;
    country: string;
    country_iso_code: string;
    federal_district: string;
    region_fias_id: string;
    region_kladr_id: string;
    region_iso_code: string;
    region_with_type: string;
    region_type: string;
    region_type_full: string;
    region: string;
    area_fias_id: string;
    area_kladr_id: string;
    area_with_type: string;
    area_type: string;
    area_type_full: string;
    area: string;
    city_fias_id: string;
    city_kladr_id: string;
    city_with_type: string;
    city_type: string;
    city_type_full: string;
    city: string;
    city_district_fias_id: string;
    city_district_with_type: string;
    city_district_type: string;
    city_district_type_full: string;
    city_district: string;
    street_fias_id: string;
    street_kladr_id: string;
    street_with_type: string;
    street_type: string;
    street_type_full: string;
    street: string;
    house_fias_id: string;
    house_kladr_id: string;
    house_type: string;
    house_type_full: string;
    house: string;
    block_type: string;
    block_type_full: string;
    block: string;
    flat_type: string;
    flat_type_full: string;
    flat: string;
    fias_id: string;
    fias_level: string;
    kladr_id: string;
    geoname_id: string;
    capital_marker: "0" | "1" | "2" | "3" | "4";
    okato: string;
    oktmo: string;
    tax_office: string;
    tax_office_legal: string;
    geo_lat: string;
    geo_lon: string;
  };
}

export type AddressProvider = "google" | "dadata";

export interface IAddressSuggestion {
  // Unified fields
  value: string; // Main display value
  unrestricted_value?: string; // Full address value

  // Location data
  coordinates?: {
    lat: number;
    lng: number;
  };

  // Structured address components
  components: {
    country?: string;
    region?: string;
    city?: string;
    district?: string;
    street?: string;
    house?: string;
    block?: string;
    flat?: string;
    postal_code?: string;
  };

  // Identifiers
  fias_id?: string;
  kladr_id?: string;
  place_id?: string;

  // Metadata
  provider: AddressProvider;
  raw?: IGoogleRawResult | IDadataRawResult;
}

export class AddressComponents {
  @ApiProperty({
    description: "Country name",
    example: "Россия",
    required: false,
  })
  country?: string;

  @ApiProperty({
    description: "Region name",
    example: "г Москва",
    required: false,
  })
  region?: string;

  @ApiProperty({
    description: "City name",
    example: "г Москва",
    required: false,
  })
  city?: string;

  @ApiProperty({
    description: "District name",
    example: "р-н Тверской",
    required: false,
  })
  district?: string;

  @ApiProperty({
    description: "Street name",
    example: "ул Тверская",
    required: false,
  })
  street?: string;

  @ApiProperty({ description: "House number", example: "1", required: false })
  house?: string;

  @ApiProperty({
    description: "Block/building number",
    example: "1",
    required: false,
  })
  block?: string;

  @ApiProperty({
    description: "Apartment/office number",
    example: "123",
    required: false,
  })
  flat?: string;

  @ApiProperty({
    description: "Postal code",
    example: "125009",
    required: false,
  })
  postal_code?: string;
}

export class Coordinates {
  @Expose()
  @ApiProperty({ description: "Latitude", example: 55.7558 })
  lat: number;

  @Expose()
  @ApiProperty({ description: "Longitude", example: 37.6173 })
  lng: number;
}

export class AddressSuggestion implements IAddressSuggestion {
  @Expose()
  @ApiProperty({
    description: "Main display value",
    example: "г Москва, ул Тверская, д 1",
  })
  value: string;

  @Expose()
  @ApiProperty({
    description: "Full address value",
    example: "125009, г Москва, ул Тверская, д 1",
    required: false,
  })
  unrestricted_value?: string;

  @Expose()
  @ApiProperty({
    description: "Geographic coordinates",
    type: Coordinates,
    required: false,
  })
  coordinates?: Coordinates;

  @ApiProperty({
    description: "Structured address components",
    type: AddressComponents,
  })
  components: AddressComponents;

  @ApiProperty({
    description: "FIAS identifier",
    example: "8f41253d-6e3b-48a9-842a-25ba894bd093",
    required: false,
  })
  fias_id?: string;

  @ApiProperty({
    description: "KLADR identifier",
    example: "7700000000000",
    required: false,
  })
  kladr_id?: string;

  @ApiProperty({
    description: "Google Place ID",
    example: "ChIJyX6mjwXKUjoR1KiaB9_KTTY",
    required: false,
  })
  place_id?: string;

  @ApiProperty({
    description: "Address provider",
    enum: ["dadata", "google"],
  })
  provider: AddressProvider;

  @ApiPropertyOptional()
  @ApiProperty({
    description: "Original response from the provider",
    type: "object",
    required: false,
  })
  @IsOptional()
  raw?: IGoogleRawResult | IDadataRawResult;
}
