import { Module } from "@nestjs/common";
import { AuthController } from "./controllers/auth.controller";
import { AuthService } from "./services/auth.service";
import { WorkersModule } from "src/workers/workers.module";
import { JwtModule } from "@nestjs/jwt";
import { SessionsService } from "src/sessions/sessions.service";
import { DrizzleModule } from "@postgress-db/drizzle.module";

@Module({
  imports: [
    DrizzleModule,
    WorkersModule,
    /* JWT module */
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: process.env.JWT_EXPIRES_IN,
      },
    }),
  ],
  providers: [AuthService, SessionsService],
  controllers: [AuthController],
})
export class AuthModule {}
