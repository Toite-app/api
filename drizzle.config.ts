import * as dotenv from "dotenv";
import type { Config } from "drizzle-kit";

dotenv.config({
  path: process.env.NODE_ENV === "test" ? "./.env.test" : "./.env",
});

export default {
  schema: "./src/@base/drizzle/schema",
  out: "./src/@base/drizzle/migrations",
  // driver: "pg",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRESQL_URL,
  },
} satisfies Config;
