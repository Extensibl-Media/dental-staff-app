ALTER TABLE "recurrence_days" DROP CONSTRAINT "recurrence_days_timesheet_id_timesheets_id_fk";
--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2024-06-11T05:40:13.857Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2024-06-11T05:40:13.857Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2024-06-11T05:40:13.857Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2024-06-11T05:40:13.857Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2024-06-11T05:40:13.857Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2024-06-11T05:40:13.857Z';--> statement-breakpoint
ALTER TABLE "recurrence_days" DROP COLUMN IF EXISTS "timesheet_id";