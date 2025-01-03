import { AllExceptionsFilter } from "@core/errors/filter";
import { RolesGuard } from "@core/guards/roles.guard";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_PIPE } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { ThrottlerModule } from "@nestjs/throttler";
import { ZodValidationPipe } from "nestjs-zod";
import { AddressesModule } from "src/addresses/addresses.module";

import { AuthModule } from "./auth/auth.module";
import { SessionAuthGuard } from "./auth/guards/session-auth.guard";
import { DrizzleModule } from "./drizzle/drizzle.module";
import { RestaurantsModule } from "./restaurants/restaurants.module";
import { SessionsService } from "./sessions/sessions.service";
import { WorkersModule } from "./workers/workers.module";

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
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>("MONGO_URL"),
      }),
    }),
    AuthModule,
    WorkersModule,
    RestaurantsModule,
    AddressesModule,
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
