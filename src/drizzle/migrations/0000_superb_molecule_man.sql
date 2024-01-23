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
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
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
	"updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "restaurants_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"login" text NOT NULL,
	"role" "workerRoleEnum" NOT NULL,
	"passwordHash" text NOT NULL,
	"isBlocked" boolean DEFAULT false,
	"hiredAt" timestamp,
	"firedAt" timestamp,
	"onlineAt" timestamp,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "workers_id_unique" UNIQUE("id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "restaurantHours" ADD CONSTRAINT "restaurantHours_restaurantId_restaurants_id_fk" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
