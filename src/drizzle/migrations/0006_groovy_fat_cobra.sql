ALTER TABLE "restaurantHours" DROP CONSTRAINT "restaurantHours_restaurantId_restaurants_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "restaurantHours" ADD CONSTRAINT "restaurantHours_restaurantId_restaurants_id_fk" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
