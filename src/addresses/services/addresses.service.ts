import { Injectable } from "@nestjs/common";

import {
  AddressProvider,
  IAddressSuggestion,
} from "../entities/suggestion.entity";

import { DadataService } from "./dadata.service";
import { GoogleService } from "./google.service";

@Injectable()
export class AddressesService {
  constructor(
    private readonly dadataService: DadataService,
    private readonly googleService: GoogleService,
  ) {}

  public async getSuggestions(
    query: string,
    preferredProvider: AddressProvider = "dadata",
    language = "ru",
    includeRaw = false,
  ): Promise<IAddressSuggestion[]> {
    if (preferredProvider === "dadata") {
      return this.dadataService.getSuggestions(query, language, includeRaw);
    } else {
      return this.googleService.getSuggestions(query, language, includeRaw);
    }
  }
}
