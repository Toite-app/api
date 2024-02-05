DO $$ BEGIN
 CREATE TYPE "workerRoleEnum" AS ENUM('SYSTEM_ADMIN', 'CHIEF_ADMIN', 'ADMIN', 'KITCHENER', 'WAITER', 'CASHIER', 'DISPATCHER', 'COURIER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "restaurantHours" (
	"id" uuid DEFAULT gen_random_uuid(),
	"restaurantId" uuid NOT NULL,
	"dayOfWeek" text NOT NULL,
	"openingTime" time NOT NULL,
	"closingTime" time NOT NULL,
	"isEnabled" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "restaurants" (
	"id" uuid DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"legalEntity" text,
	"address" text,
	"latitude" numeric,
	"longitude" numeric,
	"isEnabled" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workers" (
	"id" uuid DEFAULT gen_random_uuid(),
	"name" text,
	"restaurantId" uuid,
	"login" text NOT NULL,
	"role" "workerRoleEnum" NOT NULL,
	"passwordHash" text NOT NULL,
	"isBlocked" boolean DEFAULT false,
	"hiredAt" timestamp,
	"firedAt" timestamp,
	"onlineAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workers_login_unique" UNIQUE("login")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" uuid DEFAULT gen_random_uuid(),
	"workerId" uuid NOT NULL,
	"httpAgent" text,
	"ipAddress" text,
	"token" text NOT NULL,
	"refreshedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
