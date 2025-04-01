import { DayOfWeekEnum } from "@core/types/general";
import { Injectable } from "@nestjs/common";
import { getTimeZones } from "@vvo/tzdb";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

@Injectable()
export class TimezonesService {
  public getAllTimezones(): string[] {
    const timezones = getTimeZones({
      includeUtc: true,
    }).filter((tz) => tz.continentCode === "EU" || tz.countryCode === "RU");

    return timezones.map((tz) => tz.name);
  }

  public checkTimezone(timezone: string): boolean {
    const timezones = this.getAllTimezones();

    return timezones.includes(timezone);
  }

  public getCurrentDayOfWeek(timezone: string): DayOfWeekEnum {
    // Get current date in the specified timezone
    const date = toZonedTime(new Date(), timezone);

    // Get day of week in lowercase (monday, tuesday, etc)
    const dayOfWeek = format(date, "EEEE").toLowerCase();

    return dayOfWeek as DayOfWeekEnum;
  }

  public getLocalDate(timezone: string): Date {
    return toZonedTime(new Date(), timezone);
  }

  public getCurrentTime(timezone: string): string {
    const date = toZonedTime(new Date(), timezone);

    return format(date, "HH:mm:ss");
  }
}
