import { IsArray, IsString } from "@i18n-class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class TimezonesListEntity {
  @Expose()
  @ApiProperty({
    description: "List of timezone names",
    examples: ["Europe/Tallinn"],
    type: [String],
  })
  @IsArray()
  @IsString({
    each: true,
  })
  timezones: string[];
}
