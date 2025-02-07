import * as path from "path";

import env from "@core/env";
import { RolesGuard } from "@core/guards/roles.guard";
import { RedisModule } from "@liaoliaots/nestjs-redis";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD, APP_PIPE } from "@nestjs/core";
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
import { EncryptionModule } from "src/@base/encryption/encryption.module";
import { S3Module } from "src/@base/s3/s3.module";
import { AddressesModule } from "src/addresses/addresses.module";
import { DishCategoriesModule } from "src/dish-categories/dish-categories.module";
import { DishesModule } from "src/dishes/dishes.module";
import { FilesModule } from "src/files/files.module";
import { GuestsModule } from "src/guests/guests.module";
import { OrdersModule } from "src/orders/orders.module";
import { TimezonesModule } from "src/timezones/timezones.module";

import { DrizzleModule } from "./@base/drizzle/drizzle.module";
import { AuthModule } from "./auth/auth.module";
import { SessionAuthGuard } from "./auth/guards/session-auth.guard";
import { RestaurantsModule } from "./restaurants/restaurants.module";
import { WorkersModule } from "./workers/workers.module";
import { SocketModule } from './socket/socket.module';

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
    RedisModule.forRoot({
      config: {
        url: `${env.REDIS_URL}/1`,
      },
    }),
    BullModule.forRoot({
      prefix: "toite",
      connection: {
        url: `${env.REDIS_URL}/2`,
      },
    }),
    EncryptionModule,
    TimezonesModule,
    AuthModule,
    WorkersModule,
    RestaurantsModule,
    AddressesModule,
    GuestsModule,
    DishesModule,
    DishCategoriesModule,
    S3Module,
    FilesModule,
    NestjsFormDataModule,
    OrdersModule,
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
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
