import { Module } from "@nestjs/common";
import { AuthController } from "./controllers/auth.controller";
import { AuthService } from "./services/auth.service";
import { WorkersModule } from "src/workers/workers.module";
import { SessionsService } from "src/sessions/sessions.service";
import { DrizzleModule } from "@postgress-db/drizzle.module";

@Module({
  imports: [DrizzleModule, WorkersModule],
  providers: [AuthService, SessionsService],
  controllers: [AuthController],
})
export class AuthModule {}
