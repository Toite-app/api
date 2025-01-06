export enum DayOfWeekEnum {
  monday = "monday",
  tuesday = "tuesday",
  wednesday = "wednesday",
  thursday = "thursday",
  friday = "friday",
  saturday = "saturday",
  sunday = "sunday",
}

export type DayOfWeek = keyof typeof DayOfWeekEnum;
