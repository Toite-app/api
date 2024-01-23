import { Expose, Type } from "class-transformer";
import { AuthTokenEntity } from "./auth-token.entity";
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmptyObject, IsObject, ValidateNested } from "class-validator";

export class AccessTokenResponse {
  @IsObject()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => AuthTokenEntity)
  @Expose()
  @ApiProperty({
    description: "Access token",
    type: AuthTokenEntity,
  })
  accessToken: AuthTokenEntity;
}
