import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const signInSchema = z.object({
  login: z.string(),
  password: z.string(),
});

export class SignInDto extends createZodDto(signInSchema) {}
