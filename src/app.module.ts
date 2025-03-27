import * as path from "path";

import env from "@core/env";
import { RedisModule } from "@liaoliaots/nestjs-redis";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { ThrottlerModule } from "@nestjs/throttler";
import { NestjsFormDataModule } from "nestjs-form-data";
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from "nestjs-i18n";
import { ZodValidationPipe } from "nestjs-zod";
import { AuditLogsInterceptor } from "src/@base/audit-logs/audit-logs.interceptor";
import { AuditLogsModule } from "src/@base/audit-logs/audit-logs.module";
import { CacheInterceptor } from "src/@base/cache/cache.interceptor";
import { CacheModule } from "src/@base/cache/cache.module";
import { EncryptionModule } from "src/@base/encryption/encryption.module";
import { RedisChannels } from "src/@base/redis/channels";
import { RedlockModule } from "src/@base/redlock/redlock.module";
import { S3Module } from "src/@base/s3/s3.module";
import { SnapshotsModule } from "src/@base/snapshots/snapshots.module";
import { SocketModule } from "src/@socket/socket.module";
import { AddressesModule } from "src/addresses/addresses.module";
import { DiscountsModule } from "src/discounts/discounts.module";
import { DishCategoriesModule } from "src/dish-categories/dish-categories.module";
import { DishesModule } from "src/dishes/dishes.module";
import { DishesMenusModule } from "src/dishes-menus/dishes-menus.module";
import { FilesModule } from "src/files/files.module";
import { GuestsModule } from "src/guests/guests.module";
import { OrdersModule } from "src/orders/orders.module";
import { PaymentMethodsModule } from "src/payment-methods/payment-methods.module";
import { RestaurantGuard } from "src/restaurants/@/guards/restaurant.guard";
import { TimezonesModule } from "src/timezones/timezones.module";
import { WorkshiftsModule } from "src/workshifts/workshifts.module";

import { DrizzleModule } from "./@base/drizzle/drizzle.module";
import { AuthModule } from "./auth/auth.module";
import { SessionAuthGuard } from "./auth/guards/session-auth.guard";
import { RestaurantsModule } from "./restaurants/restaurants.module";
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
    SnapshotsModule,
    AuditLogsModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>("MONGO_URL"),
      }),
    }),
    RedisModule.forRoot({
      config: {
        url: `${env.REDIS_URL}/${RedisChannels.COMMON}`,
      },
    }),
    BullModule.forRoot({
      prefix: "toite",
      connection: {
        url: `${env.REDIS_URL}/${RedisChannels.BULLMQ}`,
      },
    }),
    EncryptionModule,
    TimezonesModule,
    AuthModule,
    WorkersModule,
    RedlockModule,
    RestaurantsModule,
    AddressesModule,
    GuestsModule,
    DishesMenusModule,
    DishesModule,
    DishCategoriesModule,
    S3Module,
    FilesModule,
    NestjsFormDataModule,
    OrdersModule,
    CacheModule,
    I18nModule.forRoot({
      fallbackLanguage: "en",
      loaderOptions: {
        path: path.join(__dirname, "/i18n/messages/"),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ["lang"] },
        new HeaderResolver(["x-lang"]),
        AcceptLanguageResolver,
      ],
    }),
    SocketModule,
    PaymentMethodsModule,
    DiscountsModule,
    WorkshiftsModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: SessionAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogsInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: RestaurantGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
