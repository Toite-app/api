import { migrate as _migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db";

export const migrate = async () => {
  await _migrate(db, {
    migrationsFolder: "./src/drizzle/migrations",
  });
};
