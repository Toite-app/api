import { IPagination } from "@core/decorators/pagination.decorator";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsNumber } from "class-validator";

export interface IPaginationMeta
  extends Pick<IPagination, "page" | "size" | "offset"> {
  total: number;
}

export class PaginationMetaDto implements IPaginationMeta {
  @IsNumber()
  @Expose()
  @ApiProperty({
    description: "Current page number",
    example: 1,
  })
  page: number;

  @IsNumber()
  @Expose()
  @ApiProperty({
    description: "Size of the page",
    example: 50,
  })
  size: number;

  @IsNumber()
  @Expose()
  @ApiProperty({
    description: "Amount of entities that was skipped",
    example: 0,
  })
  offset: number;

  @IsNumber()
  @Expose()
  @ApiProperty({
    description: "Total number of entities",
    example: 100,
  })
  total: number;
}
