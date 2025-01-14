import env from "@core/env";
import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { firstValueFrom } from "rxjs";

import {
  IAddressSuggestion,
  IGoogleRawResult,
} from "../entities/suggestion.entity";

interface GoogleGeocodingResponse {
  results: IGoogleRawResult[];
  status:
    | "OK"
    | "ZERO_RESULTS"
    | "OVER_QUERY_LIMIT"
    | "REQUEST_DENIED"
    | "INVALID_REQUEST"
    | "UNKNOWN_ERROR";
}

@Injectable()
export class GoogleService {
  private readonly API_URL =
    "https://maps.googleapis.com/maps/api/geocode/json";
  private readonly API_KEY = env.GOOGLE_MAPS_API_KEY;

  constructor(private readonly httpService: HttpService) {}

  public async getSuggestions(
    query: string,
    language = "ru",
    includeRaw = false,
  ): Promise<IAddressSuggestion[]> {
    const response = await firstValueFrom(
      this.httpService.get<GoogleGeocodingResponse>(this.API_URL, {
        params: {
          address: query,
          key: this.API_KEY,
          language,
        },
      }),
    );

    return this.transformResults(response.data.results, includeRaw);
  }

  private transformResults(
    results: IGoogleRawResult[],
    includeRaw: boolean,
  ): IAddressSuggestion[] {
    return results.map((result) => {
      const components: { [key: string]: string } = {};

      result.address_components.forEach((component) => {
        if (component.types.includes("country")) {
          components.country = component.long_name;
        }
        if (component.types.includes("administrative_area_level_1")) {
          components.region = component.long_name;
        }
        if (component.types.includes("locality")) {
          components.city = component.long_name;
        }
        if (component.types.includes("sublocality")) {
          components.district = component.long_name;
        }
        if (component.types.includes("route")) {
          components.street = component.long_name;
        }
        if (component.types.includes("street_number")) {
          components.house = component.long_name;
        }
        if (component.types.includes("postal_code")) {
          components.postal_code = component.long_name;
        }
      });

      return {
        value: result.formatted_address,
        coordinates: result.geometry.location,
        components,
        place_id: result.place_id,
        provider: "google" as const,
        ...(includeRaw === true && { raw: result }),
      };
    });
  }
}
