import { Module } from "@nestjs/common";

import { ConfigModule } from "@nestjs/config";
import { DrizzleModule } from "./drizzle/drizzle.module";
import { WorkersModule } from "./workers/workers.module";
import { AuthModule } from "./auth/auth.module";
import { APP_GUARD, APP_PIPE } from "@nestjs/core";
import { ZodValidationPipe } from "nestjs-zod";
import { ThrottlerModule } from "@nestjs/throttler";
import { RolesGuard } from "@core/guards/roles.guard";
import { SessionAuthGuard } from "./auth/guards/session-auth.guard";
import { SessionsService } from "./sessions/sessions.service";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 10,
          limit: 50,
        },
      ],
    }),
    DrizzleModule,
    WorkersModule,
    AuthModule,
  ],
  providers: [
    SessionsService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: SessionAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
