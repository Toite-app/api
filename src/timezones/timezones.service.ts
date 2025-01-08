import { Injectable } from "@nestjs/common";
import { getTimeZones } from "@vvo/tzdb";
// import { formatISO } from "date-fns";
// import { utcToZonedTime } from "date-fns-tz";

@Injectable()
export class TimezonesService {
  getAllTimezones(): string[] {
    // return Intl.supportedValuesOf("timeZone");

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
