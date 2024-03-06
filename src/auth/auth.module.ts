import { Module } from "@nestjs/common";
import { DrizzleModule } from "@postgress-db/drizzle.module";
import { SessionsService } from "src/sessions/sessions.service";
import { WorkersModule } from "src/workers/workers.module";

import { AuthController } from "./controllers/auth.controller";
import { AuthService } from "./services/auth.service";

@Module({
  imports: [DrizzleModule, WorkersModule],
  providers: [AuthService, SessionsService],
  controllers: [AuthController],
})
export class AuthModule {}
