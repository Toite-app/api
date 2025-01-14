import "dotenv/config";
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { DrizzleModule } from "@postgress-db/drizzle.module";
import { WorkersModule } from "src/workers/workers.module";

import { AuthController } from "./controllers/auth.controller";
import { AuthService } from "./services/auth.service";
import { SessionsService } from "./services/sessions.service";

@Module({
  imports: [
    DrizzleModule,
    WorkersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  providers: [AuthService, SessionsService],
  controllers: [AuthController],
  exports: [AuthService, SessionsService],
})
export class AuthModule {}
