import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsArray, IsString } from "class-validator";

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
