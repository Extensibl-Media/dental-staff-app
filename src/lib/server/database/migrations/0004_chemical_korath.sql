DROP TABLE "regions";--> statement-breakpoint
DROP TABLE "subregion";--> statement-breakpoint
DROP TABLE "subregion_zipcodes";--> statement-breakpoint
ALTER TABLE "candidate_profiles" DROP CONSTRAINT "candidate_profiles_region_id_regions_id_fk";
--> statement-breakpoint
ALTER TABLE "company_office_locations" DROP CONSTRAINT "company_office_locations_region_id_regions_id_fk";
--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2025-09-10T21:43:32.994Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2025-09-10T21:43:32.994Z';--> statement-breakpoint
ALTER TABLE "candidate_document_uploads" ALTER COLUMN "created_at" SET DEFAULT '2025-09-10T21:43:32.994Z';--> statement-breakpoint
ALTER TABLE "candidate_document_uploads" ALTER COLUMN "updated_at" SET DEFAULT '2025-09-10T21:43:32.994Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2025-09-10T21:43:32.994Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2025-09-10T21:43:32.994Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2025-09-10T21:43:32.994Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2025-09-10T21:43:32.994Z';--> statement-breakpoint
ALTER TABLE "admin_config" ALTER COLUMN "id" SET DEFAULT '88041711-0e7f-424f-a09d-5660f897fefd';--> statement-breakpoint
ALTER TABLE "admin_config" ALTER COLUMN "created_at" SET DEFAULT '2025-09-10T21:43:32.996Z';--> statement-breakpoint
ALTER TABLE "admin_config" ALTER COLUMN "updated_at" SET DEFAULT '2025-09-10T21:43:32.996Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ADD COLUMN "geom" text;--> statement-breakpoint
ALTER TABLE "company_office_locations" ADD COLUMN "geom" text;--> statement-breakpoint
ALTER TABLE "candidate_profiles" DROP COLUMN IF EXISTS "region_id";--> statement-breakpoint
ALTER TABLE "company_office_locations" DROP COLUMN IF EXISTS "region_id";