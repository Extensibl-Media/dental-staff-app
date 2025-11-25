ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2025-11-25T04:44:01.388Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2025-11-25T04:44:01.388Z';--> statement-breakpoint
ALTER TABLE "candidate_document_uploads" ALTER COLUMN "created_at" SET DEFAULT '2025-11-25T04:44:01.389Z';--> statement-breakpoint
ALTER TABLE "candidate_document_uploads" ALTER COLUMN "updated_at" SET DEFAULT '2025-11-25T04:44:01.389Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2025-11-25T04:44:01.388Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2025-11-25T04:44:01.388Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2025-11-25T04:44:01.388Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2025-11-25T04:44:01.388Z';--> statement-breakpoint
ALTER TABLE "admin_config" ALTER COLUMN "id" SET DEFAULT '926dfdec-c6e5-4fc5-95da-29ba2214ccf9';--> statement-breakpoint
ALTER TABLE "admin_config" ALTER COLUMN "created_at" SET DEFAULT '2025-11-25T04:44:01.390Z';--> statement-breakpoint
ALTER TABLE "admin_config" ALTER COLUMN "updated_at" SET DEFAULT '2025-11-25T04:44:01.390Z';--> statement-breakpoint
ALTER TABLE "requisitions" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "timesheets" ALTER COLUMN "hours_raw" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "timesheets" DROP COLUMN "candidate_rate_base";--> statement-breakpoint
ALTER TABLE "timesheets" DROP COLUMN "candidate_rate_overtime";