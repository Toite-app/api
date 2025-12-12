import childProcess from "child_process";

import { sql } from "drizzle-orm";
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as dishCategories from "src/@base/drizzle/schema/dish-categories";
import * as dishes from "src/@base/drizzle/schema/dishes";
import * as files from "src/@base/drizzle/schema/files";
import * as general from "src/@base/drizzle/schema/general";
import * as guests from "src/@base/drizzle/schema/guests";
import * as manyToMany from "src/@base/drizzle/schema/many-to-many";
import * as orderDeliveries from "src/@base/drizzle/schema/order-deliveries";
import * as orderDishes from "src/@base/drizzle/schema/order-dishes";
import * as orders from "src/@base/drizzle/schema/orders";
import * as restaurantWorkshops from "src/@base/drizzle/schema/restaurant-workshop";
import * as restaurants from "src/@base/drizzle/schema/restaurants";
import * as sessions from "src/@base/drizzle/schema/sessions";
import * as workers from "src/@base/drizzle/schema/workers";

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
  ...orderDeliveries,
  ...orderDishes,
  ...orders,
  ...files,
};

export class DatabaseHelper {
  constructor() {}

  public static pg = drizzle(
    new Pool({
      connectionString: process.env.POSTGRESQL_URL,
      ssl:
        process.env.NODE_ENV === "production" &&
        String(process.env.POSTGRESQL_URL).indexOf("sslmode=required") !== -1
          ? true
          : false,
    }),
    { schema },
  );

  public static async truncateAll() {
    console.log("Truncating all tables...");

    const tables = await this.pg
      .execute(
        sql`   
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE';
      `,
      )
      .then((res) => res.rows.map((row) => row.table_name as string));

    for (const table of tables) {
      console.log(`Truncating table ${table}`);

      await this.pg.execute(
        sql`TRUNCATE TABLE ${sql.identifier(table)} CASCADE;`,
      );
    }
  }

  public static async migrate() {
    console.log("Migrating database...");

    await migrate(this.pg, {
      migrationsFolder: "./src/drizzle/migrations",
    });

    console.log("Database migrated!");
  }

  public static async push() {
    console.log("Pushing database...");

    await childProcess.execSync("drizzle-kit push", {
      stdio: "inherit",
    });
  }
}
