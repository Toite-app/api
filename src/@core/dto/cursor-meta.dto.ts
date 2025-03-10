import { ICursor } from "@core/decorators/cursor.decorator";
import { IsNotEmpty, IsNumber, IsString } from "@i18n-class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export interface ICursorMeta extends Pick<ICursor, "cursorId" | "limit"> {
  total: number;
}

export class CursorMetaDto implements ICursorMeta {
  @Expose()
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional({
    description: "Cursor id",
    example: "123",
  })
  cursorId: string | null;

  @Expose()
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: "Limit",
    example: 20,
  })
  limit: number;

  @Expose()
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: "Total number of items",
    example: 100,
  })
  total: number;
}
