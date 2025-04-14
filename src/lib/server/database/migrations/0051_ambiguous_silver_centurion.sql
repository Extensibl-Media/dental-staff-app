DO $$ BEGIN
 CREATE TYPE "public"."timesheet_status" AS ENUM('PENDING', 'APPROVED', 'DISCREPANCY', 'REJECTED', 'VOID');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2025-04-08T19:37:51.840Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2025-04-08T19:37:51.840Z';--> statement-breakpoint
ALTER TABLE "candidate_document_uploads" ALTER COLUMN "created_at" SET DEFAULT '2025-04-08T19:37:51.840Z';--> statement-breakpoint
ALTER TABLE "candidate_document_uploads" ALTER COLUMN "updated_at" SET DEFAULT '2025-04-08T19:37:51.840Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2025-04-08T19:37:51.840Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2025-04-08T19:37:51.840Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2025-04-08T19:37:51.840Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2025-04-08T19:37:51.840Z';--> statement-breakpoint
ALTER TABLE "timesheets" ADD COLUMN "status" "timesheet_status" DEFAULT 'PENDING' NOT NULL;