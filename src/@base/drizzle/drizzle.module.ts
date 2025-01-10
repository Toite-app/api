import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { PG_CONNECTION } from "../../constants";

import * as dishCategories from "./schema/dish-categories";
import * as dishes from "./schema/dishes";
import * as guests from "./schema/guests";
import * as manyToMany from "./schema/many-to-many";
import * as restaurantWorkshops from "./schema/restaurant-workshop";
import * as restaurants from "./schema/restaurants";
import * as sessions from "./schema/sessions";
import * as workers from "./schema/workers";

export const schema = {
  ...restaurants,
  ...sessions,
  ...workers,
  ...restaurantWorkshops,
  ...guests,
  ...dishes,
  ...dishCategories,
  ...manyToMany,
};

export type Schema = typeof schema;

@Module({
  providers: [
    {
      provide: PG_CONNECTION,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const connectionString = configService.get<string>("POSTGRESQL_URL");
        const pool = new Pool({
          connectionString,
          ssl: process.env.NODE_ENV === "production" ? true : false,
        });

        return drizzle(pool, { schema }) as NodePgDatabase<Schema>;
      },
    },
  ],
  exports: [PG_CONNECTION],
})
export class DrizzleModule {}
