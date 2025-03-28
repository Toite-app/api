import * as dotenv from "dotenv";
import type { Config } from "drizzle-kit";

dotenv.config({
  path: "utils/seed/.env",
});

const url = `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@localhost:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;

export default {
  schema: "./src/@base/drizzle/schema",
  out: "./src/@base/drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
} satisfies Config;
