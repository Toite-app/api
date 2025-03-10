import { IsArray } from "@i18n-class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { CursorMetaDto } from "./cursor-meta.dto";

export class CursorResponseDto {
  @IsArray()
  @Expose()
  data: unknown[];

  @Expose()
  @ApiProperty({ description: "Meta information about pagination" })
  @Type(() => CursorMetaDto)
  meta: CursorMetaDto;
}
