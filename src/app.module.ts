import { Module } from "@nestjs/common";

import { ConfigModule } from "@nestjs/config";
import { DrizzleModule } from "./drizzle/drizzle.module";
import { WorkersModule } from "./workers/workers.module";
import { AuthModule } from "./auth/auth.module";
import { APP_FILTER, APP_GUARD, APP_PIPE } from "@nestjs/core";
import { ZodValidationPipe } from "nestjs-zod";
import { ThrottlerModule } from "@nestjs/throttler";
import { RolesGuard } from "@core/guards/roles.guard";
import { SessionAuthGuard } from "./auth/guards/session-auth.guard";
import { SessionsService } from "./sessions/sessions.service";
import { RestaurantsModule } from "./restaurants/restaurants.module";
import { AllExceptionsFilter } from "@core/errors/filter";

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
    AuthModule,
    WorkersModule,
    RestaurantsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
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
