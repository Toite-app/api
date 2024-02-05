import { sessions } from "@postgress-db/schema";
import { Expose } from "class-transformer";
import { IsUUID } from "class-validator";
import { createInsertSchema } from "drizzle-zod";
import { createZodDto } from "nestjs-zod";

const insertSessionSchema = createInsertSchema(sessions).pick({
  workerId: true,
  httpAgent: true,
  refreshToken: true,
  ipAddress: true,
});

export class SessionPayloadDto extends createZodDto(insertSessionSchema) {
  @IsUUID()
  @Expose()
  workerId!: string;
}
