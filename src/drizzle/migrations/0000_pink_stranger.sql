DO $$ BEGIN
 CREATE TYPE "workerRoleEnum" AS ENUM('SYSTEM_ADMIN', 'CHIEF_ADMIN', 'ADMIN', 'KITCHENER', 'WAITER', 'CASHIER', 'DISPATCHER', 'COURIER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "restaurantHours" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurantId" serial NOT NULL,
	"dayOfWeek" text NOT NULL,
	"openingTime" time NOT NULL,
	"closingTime" time NOT NULL,
	"isEnabled" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "restaurantHours_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "restaurants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"legalEntity" text,
	"address" text,
	"latitude" numeric,
	"longitude" numeric,
	"isEnabled" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "restaurants_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"restaurantId" integer,
	"login" text NOT NULL,
	"role" "workerRoleEnum" NOT NULL,
	"passwordHash" text NOT NULL,
	"isBlocked" boolean DEFAULT false,
	"hiredAt" timestamp,
	"firedAt" timestamp,
	"onlineAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workers_id_unique" UNIQUE("id"),
	CONSTRAINT "workers_login_unique" UNIQUE("login")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"workerId" serial NOT NULL,
	"httpAgent" text,
	"ipAddress" text,
	"token" text NOT NULL,
	"refreshedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_id_unique" UNIQUE("id"),
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "restaurantHours" ADD CONSTRAINT "restaurantHours_restaurantId_restaurants_id_fk" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_workerId_workers_id_fk" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
