import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsJWT } from "class-validator";
import { z } from "zod";
import { Expose } from "class-transformer";

const authTokenSchema = z.object({
  value: z.string(),
  expiresAt: z.date(),
});

export type AuthToken = z.infer<typeof authTokenSchema>;

export class AuthTokenEntity implements AuthToken {
  @IsJWT({
    message: "Invalid JWT token",
  })
  @Expose()
  @ApiProperty({
    description: "JWT token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
    type: String,
  })
  value: string;

  @IsDate()
  @Expose()
  @ApiProperty({
    description: "JWT token expiration date",
    example: new Date(),
    type: Date,
  })
  expiresAt: Date;
}
