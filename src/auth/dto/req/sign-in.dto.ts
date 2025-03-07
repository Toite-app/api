import { IsString } from "@i18n-class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { z } from "zod";

export const signInSchema = z.object({
  login: z.string(),
  password: z.string(),
});

export class SignInDto implements z.infer<typeof signInSchema> {
  @IsString()
  @Expose()
  @ApiProperty({
    description: "Login of the worker",
    example: "vi.keller",
  })
  login: string;

  @IsString()
  @Expose()
  @ApiProperty({
    description: "Password of the worker",
    example: "123456",
  })
  password: string;
}
