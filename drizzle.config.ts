import * as dotenv from "dotenv";
import type { Config } from "drizzle-kit";

dotenv.config({
  path: process.env.NODE_ENV === "test" ? "./.env.test" : "./.env",
});

export default {
  schema: "./src/@base/drizzle/schema",
  out: "./src/@base/drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: String(process.env.POSTGRESQL_URL),
    ssl:
      process.env.NODE_ENV === "production" &&
      String(process.env.POSTGRESQL_URL).indexOf("sslmode=required") !== -1
        ? true
        : false,
  },
} satisfies Config;
