import "dotenv/config";
import { z } from "zod";

const validInitPass = (pass: string) => {
  const isDev = process.env?.NODE_ENV === "development";

  if (isDev && pass.length >= 6) return true;

  if (pass.length < 8) return false;
  if (!/[A-Z]/.test(pass)) return false;
  if (!/[a-z]/.test(pass)) return false;
  if (!/[0-9]/.test(pass)) return false;
  if (!/[!@#$%^&*]/.test(pass)) return false;

  return true;
};

const validPostgresUrl = (url: string) => url.includes("postgres");
const validMongoUrl = (url: string) =>
  url.includes("mongodb") && url.includes("authSource");

const validRedisUrl = (url: string) => url.includes("redis");

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(6701),

  CSRF_SECRET: z.string(),
  COOKIES_SECRET: z.string(),
  // JWT //
  JWT: z.object({
    SECRET: z.string(),
    GRACE_PERIOD: z.coerce.number().default(60), // Default 1 minute
    REFRESH_INTERVAL: z.coerce.number().default(60 * 15), // Default 15 minutes
    EXPIRES_IN: z.coerce.number().default(60 * 60 * 24 * 31), // Default 31 days
  }),
  // --- //
  // Databases //
  POSTGRESQL_URL: z.string().refine(validPostgresUrl),
  MONGO_URL: z.string().refine(validMongoUrl, {
    message: "Make sure that link is valid and have authSource",
  }),
  REDIS_URL: z.string().refine(validRedisUrl),
  // -------- //

  INITIAL_ADMIN_PASSWORD: z.string().refine(validInitPass, {
    message: "Password not secure enough",
  }),

  DADATA_API_TOKEN: z.string(),
  GOOGLE_MAPS_API_KEY: z.string(),

  S3_CONFIG: z.object({
    ACCESS_KEY_ID: z.string(),
    SECRET_ACCESS_KEY: z.string(),
    BUCKET_NAME: z.string(),
    ENDPOINT: z.string().url(),
    REGION: z.string(),
  }),

  DEV_SECRET_KEY: z.string().optional().nullable(),
});

const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  CSRF_SECRET: process.env.CSRF_SECRET,
  COOKIES_SECRET: process.env.COOKIES_SECRET,
  JWT: {
    SECRET: process.env.JWT_SECRET,
    GRACE_PERIOD: process.env.JWT_GRACE_PERIOD,
    REFRESH_INTERVAL: process.env.JWT_REFRESH_INTERVAL,
    EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  },
  POSTGRESQL_URL: process.env.POSTGRESQL_URL,
  MONGO_URL: process.env.MONGO_URL,
  REDIS_URL: process.env.REDIS_URL,
  INITIAL_ADMIN_PASSWORD: process.env.INITIAL_ADMIN_PASSWORD,
  DADATA_API_TOKEN: process.env.DADATA_API_TOKEN,
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  S3_CONFIG: {
    ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    BUCKET_NAME: process.env.S3_BUCKET_NAME,
    ENDPOINT: process.env.S3_ENDPOINT,
    REGION: process.env.S3_REGION,
  },
  DEV_SECRET_KEY: process.env?.DEV_SECRET_KEY ?? null,
});

export default env;
