CREATE TYPE "public"."weight_measure_enum" AS ENUM('grams', 'milliliters');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('EUR', 'USD', 'RUB');--> statement-breakpoint
CREATE TYPE "public"."day_of_week" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('en', 'ru', 'ee');--> statement-breakpoint
CREATE TYPE "public"."order_delivery_status_enum" AS ENUM('pending', 'dispatched', 'delivered');--> statement-breakpoint
CREATE TYPE "public"."order_dish_status_enum" AS ENUM('pending', 'cooking', 'ready', 'completed');--> statement-breakpoint
CREATE TYPE "public"."order_from_enum" AS ENUM('app', 'website', 'internal');--> statement-breakpoint
CREATE TYPE "public"."order_history_type_enum" AS ENUM('created', 'precheck', 'sent_to_kitchen', 'dishes_ready', 'discounts_enabled', 'discounts_disabled');--> statement-breakpoint
CREATE TYPE "public"."order_status_enum" AS ENUM('pending', 'cooking', 'ready', 'delivering', 'paid', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."order_type_enum" AS ENUM('hall', 'banquet', 'takeaway', 'delivery');--> statement-breakpoint
CREATE TYPE "public"."payment_method_icon" AS ENUM('YOO_KASSA', 'CASH', 'CARD');--> statement-breakpoint
CREATE TYPE "public"."payment_method_type" AS ENUM('YOO_KASSA', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."workshift_payment_type" AS ENUM('INCOME', 'EXPENSE', 'CASHLESS');--> statement-breakpoint
CREATE TYPE "public"."workshift_status_enum" AS ENUM('PLANNED', 'OPENED', 'CLOSED');--> statement-breakpoint
ALTER TYPE "public"."workerRoleEnum" RENAME TO "worker_role_enum";--> statement-breakpoint
ALTER TYPE "public"."worker_role_enum" ADD VALUE 'OWNER' BEFORE 'ADMIN';--> statement-breakpoint
CREATE TABLE "discounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '',
	"percent" integer DEFAULT 0 NOT NULL,
	"order_froms" "order_from_enum"[] NOT NULL,
	"order_types" "order_type_enum"[] NOT NULL,
	"days_of_week" "day_of_week"[] NOT NULL,
	"promocode" text,
	"apply_only_by_promocode" boolean DEFAULT false NOT NULL,
	"apply_only_at_first_order" boolean DEFAULT false NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"start_time" time,
	"end_time" time,
	"active_from" timestamp with time zone NOT NULL,
	"active_to" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discount_connections" (
	"discount_id" uuid NOT NULL,
	"dishes_menu_id" uuid NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"dish_category_id" uuid NOT NULL,
	CONSTRAINT "discount_connections_discount_id_dishes_menu_id_restaurant_id_dish_category_id_pk" PRIMARY KEY("discount_id","dishes_menu_id","restaurant_id","dish_category_id")
);
--> statement-breakpoint
CREATE TABLE "discounts_to_guests" (
	"discount_id" uuid NOT NULL,
	"guest_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "discounts_to_guests_discount_id_guest_id_pk" PRIMARY KEY("discount_id","guest_id")
);
--> statement-breakpoint
CREATE TABLE "discounts_to_orders" (
	"discount_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	CONSTRAINT "discounts_to_orders_discount_id_order_id_pk" PRIMARY KEY("discount_id","order_id")
);
--> statement-breakpoint
CREATE TABLE "dish_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_id" uuid NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"show_for_workers" boolean DEFAULT false NOT NULL,
	"show_for_guests" boolean DEFAULT false NOT NULL,
	"sort_index" serial NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dish_modifiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_removed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "dish_modifiers_to_order_dishes" (
	"dish_modifier_id" uuid NOT NULL,
	"order_dish_id" uuid NOT NULL,
	CONSTRAINT "dish_modifiers_to_order_dishes_dish_modifier_id_order_dish_id_pk" PRIMARY KEY("dish_modifier_id","order_dish_id")
);
--> statement-breakpoint
CREATE TABLE "dishes_menus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"owner_id" uuid NOT NULL,
	"is_removed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "dishes_menus_to_restaurants" (
	"restaurant_id" uuid NOT NULL,
	"dishes_menu_id" uuid NOT NULL,
	CONSTRAINT "dishes_menus_to_restaurants_restaurant_id_dishes_menu_id_pk" PRIMARY KEY("restaurant_id","dishes_menu_id")
);
--> statement-breakpoint
CREATE TABLE "dishes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_id" uuid,
	"name" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"cooking_time_in_min" integer DEFAULT 0 NOT NULL,
	"amount_per_item" integer DEFAULT 1 NOT NULL,
	"weight" integer DEFAULT 0 NOT NULL,
	"weight_measure" "weight_measure_enum" DEFAULT 'grams' NOT NULL,
	"is_label_printing_enabled" boolean DEFAULT false NOT NULL,
	"print_label_every_item" integer DEFAULT 0 NOT NULL,
	"is_published_in_app" boolean DEFAULT false NOT NULL,
	"is_published_at_site" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dishes_to_dish_categories" (
	"dish_id" uuid NOT NULL,
	"dish_category_id" uuid NOT NULL,
	CONSTRAINT "dishes_to_dish_categories_dish_id_dish_category_id_pk" PRIMARY KEY("dish_id","dish_category_id")
);
--> statement-breakpoint
CREATE TABLE "dishes_to_restaurants" (
	"dish_id" uuid NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"currency" "currency" DEFAULT 'EUR' NOT NULL,
	"is_in_stop_list" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dishes_to_restaurants_dish_id_restaurant_id_pk" PRIMARY KEY("dish_id","restaurant_id")
);
--> statement-breakpoint
CREATE TABLE "dishes_to_workshops" (
	"dish_id" uuid NOT NULL,
	"workshop_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dishes_to_workshops_dish_id_workshop_id_pk" PRIMARY KEY("dish_id","workshop_id")
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"extension" text NOT NULL,
	"bucket_name" text NOT NULL,
	"region" text NOT NULL,
	"endpoint" text NOT NULL,
	"size" integer DEFAULT 0 NOT NULL,
	"uploaded_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"bonus_balance" integer DEFAULT 0 NOT NULL,
	"last_visit_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guests_phone_unique" UNIQUE("phone"),
	CONSTRAINT "guests_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "dishes_to_images" (
	"dish_id" uuid NOT NULL,
	"image_file_id" uuid NOT NULL,
	"alt" text DEFAULT '' NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "dishes_to_images_dish_id_image_file_id_pk" PRIMARY KEY("dish_id","image_file_id")
);
--> statement-breakpoint
CREATE TABLE "order_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"worker_id" uuid,
	"status" "order_delivery_status_enum" NOT NULL,
	"address" text NOT NULL,
	"note" text,
	"latitude" numeric NOT NULL,
	"longitude" numeric NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"dispatched_at" timestamp with time zone,
	"estimated_delivery_at" timestamp with time zone,
	"delivered_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "order_dishes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"dish_id" uuid NOT NULL,
	"discount_id" uuid,
	"surcharge_id" uuid,
	"name" text NOT NULL,
	"status" "order_dish_status_enum" NOT NULL,
	"quantity" integer NOT NULL,
	"quantity_returned" integer DEFAULT 0 NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"discount_percent" numeric(10, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"surcharge_percent" numeric(10, 2) DEFAULT '0' NOT NULL,
	"surcharge_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"final_price" numeric(10, 2) NOT NULL,
	"is_removed" boolean DEFAULT false NOT NULL,
	"is_additional" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"cooking_at" timestamp with time zone,
	"ready_at" timestamp with time zone,
	"removed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "order_dishes_returnments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_dish_id" uuid NOT NULL,
	"worker_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"reason" text NOT NULL,
	"is_done_after_precheck" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_history_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"worker_id" uuid,
	"type" "order_history_type_enum" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_precheck_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"precheck_id" uuid NOT NULL,
	"name" text NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"surcharge_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"final_price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_prechecks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"worker_id" uuid NOT NULL,
	"type" "order_type_enum" NOT NULL,
	"legal_entity" text NOT NULL,
	"locale" "locale" NOT NULL,
	"currency" "currency" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_number_broneering" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_id" uuid,
	"discounts_guest_id" uuid,
	"restaurant_id" uuid,
	"payment_method_id" uuid,
	"number" text NOT NULL,
	"table_number" text,
	"type" "order_type_enum" NOT NULL,
	"status" "order_status_enum" NOT NULL,
	"currency" "currency" NOT NULL,
	"from" "order_from_enum" NOT NULL,
	"note" text,
	"guest_name" text,
	"guest_phone" text,
	"guests_amount" integer,
	"subtotal" numeric(10, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"surcharge_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"bonusUsed" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"apply_discounts" boolean DEFAULT false NOT NULL,
	"is_hidden_for_guest" boolean DEFAULT false NOT NULL,
	"is_removed" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"cooking_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"removed_at" timestamp with time zone,
	"delayed_to" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "payment_method_type" NOT NULL,
	"icon" "payment_method_icon" NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"secret_id" text,
	"secret_key" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"is_removed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "restaurant_workshops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"is_label_printing_enabled" boolean DEFAULT false NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workshop_workers" (
	"worker_id" uuid NOT NULL,
	"workshop_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workers_to_restaurants" (
	"worker_id" uuid NOT NULL,
	"restaurant_id" uuid NOT NULL,
	CONSTRAINT "workers_to_restaurants_worker_id_restaurant_id_pk" PRIMARY KEY("worker_id","restaurant_id")
);
--> statement-breakpoint
CREATE TABLE "workshift_payment_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"restaurant_id" uuid NOT NULL,
	"type" "workshift_payment_type" NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort_index" serial NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_removed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workshift_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"type" "workshift_payment_type" NOT NULL,
	"note" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" "currency" NOT NULL,
	"workshift_id" uuid NOT NULL,
	"worker_id" uuid,
	"removed_by_worker_id" uuid,
	"is_removed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workers_to_workshifts" (
	"worker_id" uuid NOT NULL,
	"workshift_id" uuid NOT NULL,
	CONSTRAINT "workers_to_workshifts_worker_id_workshift_id_pk" PRIMARY KEY("worker_id","workshift_id")
);
--> statement-breakpoint
CREATE TABLE "workshifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "workshift_status_enum" DEFAULT 'PLANNED' NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"opened_by_worker_id" uuid,
	"closed_by_worker_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"opened_at" timestamp with time zone,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "restaurantHours" RENAME TO "restaurant_hours";--> statement-breakpoint
ALTER TABLE "restaurant_hours" RENAME COLUMN "restaurantId" TO "restaurant_id";--> statement-breakpoint
ALTER TABLE "restaurant_hours" RENAME COLUMN "dayOfWeek" TO "day_of_week";--> statement-breakpoint
ALTER TABLE "restaurant_hours" RENAME COLUMN "openingTime" TO "opening_time";--> statement-breakpoint
ALTER TABLE "restaurant_hours" RENAME COLUMN "closingTime" TO "closing_time";--> statement-breakpoint
ALTER TABLE "restaurant_hours" RENAME COLUMN "isEnabled" TO "is_enabled";--> statement-breakpoint
ALTER TABLE "restaurant_hours" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "restaurant_hours" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "restaurants" RENAME COLUMN "legalEntity" TO "legal_entity";--> statement-breakpoint
ALTER TABLE "restaurants" RENAME COLUMN "isEnabled" TO "is_enabled";--> statement-breakpoint
ALTER TABLE "restaurants" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "restaurants" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "workers" RENAME COLUMN "passwordHash" TO "password_hash";--> statement-breakpoint
ALTER TABLE "workers" RENAME COLUMN "isBlocked" TO "is_blocked";--> statement-breakpoint
ALTER TABLE "workers" RENAME COLUMN "hiredAt" TO "hired_at";--> statement-breakpoint
ALTER TABLE "workers" RENAME COLUMN "firedAt" TO "fired_at";--> statement-breakpoint
ALTER TABLE "workers" RENAME COLUMN "onlineAt" TO "online_at";--> statement-breakpoint
ALTER TABLE "workers" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "workers" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "sessions" RENAME COLUMN "workerId" TO "worker_id";--> statement-breakpoint
ALTER TABLE "sessions" RENAME COLUMN "httpAgent" TO "http_agent";--> statement-breakpoint
ALTER TABLE "sessions" RENAME COLUMN "ipAddress" TO "ip";--> statement-breakpoint
ALTER TABLE "sessions" RENAME COLUMN "refreshedAt" TO "refreshed_at";--> statement-breakpoint
ALTER TABLE "sessions" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "sessions" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_token_unique";--> statement-breakpoint
ALTER TABLE "restaurant_hours" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "restaurant_hours" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurants" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "restaurants" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurants" ALTER COLUMN "address" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurants" ALTER COLUMN "latitude" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurants" ALTER COLUMN "longitude" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "workers" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "workers" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "workers" ALTER COLUMN "name" SET DEFAULT 'N/A';--> statement-breakpoint
ALTER TABLE "workers" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN "timezone" text DEFAULT 'Europe/Tallinn' NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN "currency" "currency" DEFAULT 'EUR' NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN "country_code" text DEFAULT 'EE' NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN "is_closed_forever" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN "owner_id" uuid;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "previous_id" uuid;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "online_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "workshop_workers" ADD CONSTRAINT "workshop_workers_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workshop_workers" ADD CONSTRAINT "workshop_workers_workshop_id_restaurant_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."restaurant_workshops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "discount_connections_discount_id_idx" ON "discount_connections" USING btree ("discount_id");--> statement-breakpoint
CREATE INDEX "discount_connections_dishes_menu_id_idx" ON "discount_connections" USING btree ("dishes_menu_id");--> statement-breakpoint
CREATE INDEX "discount_connections_restaurant_id_idx" ON "discount_connections" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "discount_connections_dish_category_id_idx" ON "discount_connections" USING btree ("dish_category_id");--> statement-breakpoint
CREATE INDEX "discounts_to_guests_guest_id_idx" ON "discounts_to_guests" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "discounts_to_orders_order_id_idx" ON "discounts_to_orders" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "dish_categories_menu_id_idx" ON "dish_categories" USING btree ("menu_id");--> statement-breakpoint
CREATE INDEX "dishes_menu_id_idx" ON "dishes" USING btree ("menu_id");--> statement-breakpoint
CREATE INDEX "dishes_is_published_in_app_idx" ON "dishes" USING btree ("is_published_in_app");--> statement-breakpoint
CREATE INDEX "dishes_is_published_at_site_idx" ON "dishes" USING btree ("is_published_at_site");--> statement-breakpoint
CREATE INDEX "order_dishes_order_id_idx" ON "order_dishes" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_dishes_status_idx" ON "order_dishes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "order_dishes_is_removed_idx" ON "order_dishes" USING btree ("is_removed");--> statement-breakpoint
CREATE INDEX "orders_restaurant_id_idx" ON "orders" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_is_archived_idx" ON "orders" USING btree ("is_archived");--> statement-breakpoint
CREATE INDEX "orders_is_removed_idx" ON "orders" USING btree ("is_removed");--> statement-breakpoint
CREATE INDEX "order_id_and_created_at_idx" ON "orders" USING btree ("id","created_at");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_delayed_to_idx" ON "orders" USING btree ("delayed_to");--> statement-breakpoint
CREATE INDEX "idx_restaurants_owner_id" ON "restaurants" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_worker_id" ON "sessions" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_previous_id" ON "sessions" USING btree ("previous_id");--> statement-breakpoint
ALTER TABLE "workers" DROP COLUMN "restaurantId";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "token";