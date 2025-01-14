import env from "@core/env";
import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { firstValueFrom } from "rxjs";

import {
  IAddressSuggestion,
  IDadataRawResult,
} from "../entities/suggestion.entity";

interface DadataResponse {
  suggestions: IDadataRawResult[];
}

@Injectable()
export class DadataService {
  private readonly API_URL =
    "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address";
  private readonly API_TOKEN = env.DADATA_API_TOKEN;

  constructor(private readonly httpService: HttpService) {}

  public async getSuggestions(
    query: string,
    language?: string,
    includeRaw = false,
  ): Promise<IAddressSuggestion[]> {
    const response = await firstValueFrom(
      this.httpService.post<DadataResponse>(
        this.API_URL,
        { query, language: language === "ru" ? "ru" : "en" },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Token ${this.API_TOKEN}`,
            "X-Language": language === "ru" ? "ru" : "en",
          },
        },
      ),
    );

    return this.transformSuggestions(response.data.suggestions, includeRaw);
  }

  private transformSuggestions(
    suggestions: IDadataRawResult[],
    includeRaw: boolean,
  ): IAddressSuggestion[] {
    return suggestions.map((suggestion) => ({
      value: suggestion.value,
      unrestricted_value: suggestion.unrestricted_value,
      coordinates:
        suggestion.data.geo_lat && suggestion.data.geo_lon
          ? {
              lat: parseFloat(suggestion.data.geo_lat),
              lng: parseFloat(suggestion.data.geo_lon),
            }
          : undefined,
      components: {
        country: suggestion.data.country,
        region: suggestion.data.region_with_type,
        city: suggestion.data.city_with_type,
        district: suggestion.data.city_district_with_type,
        street: suggestion.data.street_with_type,
        house: suggestion.data.house,
        block: suggestion.data.block,
        flat: suggestion.data.flat,
        postal_code: suggestion.data.postal_code,
      },
      fias_id: suggestion.data.fias_id,
      kladr_id: suggestion.data.kladr_id,
      provider: "dadata",
      ...(includeRaw === true && { raw: suggestion }),
    }));
  }
}
