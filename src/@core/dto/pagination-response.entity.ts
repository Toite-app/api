import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { PaginationMetaDto } from "./pagination-meta.dto";
import { IsArray } from "class-validator";

export class PaginationResponseDto {
  @IsArray()
  @Expose()
  data: unknown[];

  @Expose()
  @ApiProperty({ description: "Meta information about pagination" })
  @Type(() => PaginationMetaDto)
  meta: PaginationMetaDto;
}
