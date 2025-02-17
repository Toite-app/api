import { IsBoolean } from "@i18n-class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class OrderAvailableActionsEntity {
  @Expose()
  @IsBoolean()
  @ApiProperty({
    description: "Is precheck printing available",
    example: true,
  })
  canPrecheck: boolean;

  @Expose()
  @IsBoolean()
  @ApiProperty({
    description: "Is send to kitchen available",
    example: true,
  })
  canSendToKitchen: boolean;

  @Expose()
  @IsBoolean()
  @ApiProperty({
    description: "Is calculate order available",
    example: true,
  })
  canCalculate: boolean;
}
