import env from "@core/env";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { PG_CONNECTION } from "../../constants";

import * as discounts from "./schema/discounts";
import * as dishCategories from "./schema/dish-categories";
import * as dishModifiers from "./schema/dish-modifiers";
import * as dishes from "./schema/dishes";
import * as dishesMenu from "./schema/dishes-menu";
import * as files from "./schema/files";
import * as general from "./schema/general";
import * as guests from "./schema/guests";
import * as manyToMany from "./schema/many-to-many";
import * as orderDeliveries from "./schema/order-deliveries";
import * as orderDishes from "./schema/order-dishes";
import * as orders from "./schema/orders";
import * as paymentMethods from "./schema/payment-methods";
import * as restaurantWorkshops from "./schema/restaurant-workshop";
import * as restaurants from "./schema/restaurants";
import * as sessions from "./schema/sessions";
import * as workers from "./schema/workers";

export const schema = {
  ...general,
  ...restaurants,
  ...sessions,
  ...workers,
  ...restaurantWorkshops,
  ...guests,
  ...dishes,
  ...dishCategories,
  ...manyToMany,
  ...files,
  ...orderDishes,
  ...orderDeliveries,
  ...orders,
  ...paymentMethods,
  ...dishModifiers,
  ...discounts,
  ...dishesMenu,
};

export type Schema = typeof schema;
export type DrizzleDatabase = NodePgDatabase<Schema>;
export type DrizzleTransaction = Parameters<
  Parameters<DrizzleDatabase["transaction"]>[0]
>[0];

export interface PgTransactionConfig {
  isolationLevel?:
    | "read uncommitted"
    | "read committed"
    | "repeatable read"
    | "serializable";
  accessMode?: "read only" | "read write";
  deferrable?: boolean;
}

@Module({
  providers: [
    {
      provide: PG_CONNECTION,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const connectionString = configService.get<string>("POSTGRESQL_URL");
        const pool = new Pool({
          connectionString,
          ssl: env.NODE_ENV === "production" ? true : false,
        });

        return drizzle(pool, { schema }) as NodePgDatabase<Schema>;
      },
    },
  ],
  exports: [PG_CONNECTION],
})
export class DrizzleModule {}
