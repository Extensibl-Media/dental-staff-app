ALTER TABLE "invoices" DROP CONSTRAINT "invoices_recurrence_day_id_recurrence_days_id_fk";
--> statement-breakpoint
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_workday_id_workdays_id_fk";
--> statement-breakpoint
ALTER TABLE "timesheets" DROP CONSTRAINT "timesheets_recurrence_day_id_recurrence_days_id_fk";
--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2025-04-04T23:02:38.826Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2025-04-04T23:02:38.826Z';--> statement-breakpoint
ALTER TABLE "candidate_document_uploads" ALTER COLUMN "created_at" SET DEFAULT '2025-04-04T23:02:38.826Z';--> statement-breakpoint
ALTER TABLE "candidate_document_uploads" ALTER COLUMN "updated_at" SET DEFAULT '2025-04-04T23:02:38.826Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2025-04-04T23:02:38.826Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2025-04-04T23:02:38.826Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2025-04-04T23:02:38.826Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2025-04-04T23:02:38.826Z';--> statement-breakpoint
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "recurrence_day_id";--> statement-breakpoint
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "workday_id";--> statement-breakpoint
ALTER TABLE "timesheets" DROP COLUMN IF EXISTS "recurrence_day_id";