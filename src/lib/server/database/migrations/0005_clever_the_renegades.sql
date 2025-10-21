ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2025-10-15T03:56:09.105Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2025-10-15T03:56:09.105Z';--> statement-breakpoint
ALTER TABLE "candidate_document_uploads" ALTER COLUMN "created_at" SET DEFAULT '2025-10-15T03:56:09.105Z';--> statement-breakpoint
ALTER TABLE "candidate_document_uploads" ALTER COLUMN "updated_at" SET DEFAULT '2025-10-15T03:56:09.105Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2025-10-15T03:56:09.105Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2025-10-15T03:56:09.105Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "geom" SET DATA TYPE geometry(POINT, 4326);--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2025-10-15T03:56:09.105Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2025-10-15T03:56:09.105Z';--> statement-breakpoint
ALTER TABLE "company_office_locations" ALTER COLUMN "geom" SET DATA TYPE geometry(POINT, 4326);--> statement-breakpoint
ALTER TABLE "admin_config" ALTER COLUMN "id" SET DEFAULT '7eea7c47-e63c-4c77-bda1-4d7fbcec20cb';--> statement-breakpoint
ALTER TABLE "admin_config" ALTER COLUMN "created_at" SET DEFAULT '2025-10-15T03:56:09.107Z';--> statement-breakpoint
ALTER TABLE "admin_config" ALTER COLUMN "updated_at" SET DEFAULT '2025-10-15T03:56:09.107Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ADD COLUMN "preferred_hourly_min" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ADD COLUMN "preferred_hourly_max" smallint DEFAULT 0 NOT NULL;