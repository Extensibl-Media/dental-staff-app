ALTER TABLE "client_staff_locations" RENAME COLUMN "primary_location_id" TO "location_id";--> statement-breakpoint
ALTER TABLE "client_staff_locations" DROP CONSTRAINT "client_staff_locations_primary_location_id_company_office_locations_id_fk";
--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2024-08-08T03:25:48.500Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2024-08-08T03:25:48.500Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2024-08-08T03:25:48.500Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2024-08-08T03:25:48.500Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2024-08-08T03:25:48.500Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2024-08-08T03:25:48.500Z';--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "created_at" SET DEFAULT '2024-08-08T03:25:48.510Z';--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "updated_at" SET DEFAULT '2024-08-08T03:25:48.510Z';--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "created_at" SET DEFAULT '2024-08-08T03:25:48.510Z';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_staff_locations" ADD CONSTRAINT "client_staff_locations_location_id_company_office_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."company_office_locations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
