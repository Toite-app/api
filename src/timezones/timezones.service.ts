import { Injectable } from "@nestjs/common";
import { getTimeZones } from "@vvo/tzdb";

@Injectable()
export class TimezonesService {
  getAllTimezones(): string[] {
    const timezones = getTimeZones({
      includeUtc: true,
    }).filter((tz) => tz.continentCode === "EU" || tz.countryCode === "RU");

    return timezones.map((tz) => tz.name);
  }

  checkTimezone(timezone: string): boolean {
    const timezones = this.getAllTimezones();

    return timezones.includes(timezone);
  }
}
