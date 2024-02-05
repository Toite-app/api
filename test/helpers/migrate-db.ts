import { migrate as _migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db";

export const migrate = async () => {
  const result = await _migrate(db, {
    migrationsFolder: "./src/drizzle/migrations",
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });

  console.log("DB Migrated", result);
};
