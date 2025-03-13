import { IsOptional, IsUUID } from "@i18n-class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class WorkshiftNavigationEntity {
  @IsUUID()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional({
    description: "ID of the previous workshift",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  prevId: string | null;

  @IsUUID()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional({
    description: "ID of the next workshift",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  nextId: string | null;
}
