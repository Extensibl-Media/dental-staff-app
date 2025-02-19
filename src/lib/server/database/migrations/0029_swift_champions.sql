DROP TABLE "calendar_days";--> statement-breakpoint
DROP TABLE "invoices";--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2024-10-24T05:12:35.088Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2024-10-24T05:12:35.088Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2024-10-24T05:12:35.088Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2024-10-24T05:12:35.088Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2024-10-24T05:12:35.088Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2024-10-24T05:12:35.088Z';--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "created_at" SET DEFAULT '2024-10-24T05:12:35.093Z';--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "updated_at" SET DEFAULT '2024-10-24T05:12:35.093Z';--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "created_at" SET DEFAULT '2024-10-24T05:12:35.093Z';--> statement-breakpoint
ALTER TABLE "timesheets" ADD COLUMN "week_begin_date" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "timesheets" ADD COLUMN "hours_raw" json DEFAULT '[]'::json NOT NULL;