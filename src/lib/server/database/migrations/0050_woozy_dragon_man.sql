ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2025-04-07T21:00:12.416Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2025-04-07T21:00:12.416Z';--> statement-breakpoint
ALTER TABLE "candidate_document_uploads" ALTER COLUMN "created_at" SET DEFAULT '2025-04-07T21:00:12.416Z';--> statement-breakpoint
ALTER TABLE "candidate_document_uploads" ALTER COLUMN "updated_at" SET DEFAULT '2025-04-07T21:00:12.416Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2025-04-07T21:00:12.416Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2025-04-07T21:00:12.416Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2025-04-07T21:00:12.416Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2025-04-07T21:00:12.416Z';--> statement-breakpoint
ALTER TABLE "timesheets" ALTER COLUMN "candidate_rate_base" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "timesheets" ALTER COLUMN "candidate_rate_overtime" SET DATA TYPE numeric;