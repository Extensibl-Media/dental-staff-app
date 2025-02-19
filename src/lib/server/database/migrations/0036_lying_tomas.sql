CREATE TABLE IF NOT EXISTS "candidate_blacklists" (
	"candidate_id" text NOT NULL,
	"company_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "candidate_blacklists_candidate_id_company_id_pk" PRIMARY KEY("candidate_id","company_id")
);
--> statement-breakpoint
ALTER TABLE "workdays" DROP CONSTRAINT "workdays_timesheet_id_timesheets_id_fk";
--> statement-breakpoint
ALTER TABLE "workdays" DROP CONSTRAINT "workdays_recurrence_day_id_recurrence_days_id_fk";
--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2024-11-27T20:33:45.181Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2024-11-27T20:33:45.181Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2024-11-27T20:33:45.180Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2024-11-27T20:33:45.180Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2024-11-27T20:33:45.181Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2024-11-27T20:33:45.181Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ADD COLUMN "approved" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "timesheets" ADD COLUMN "recurrence_day_id" text;--> statement-breakpoint
ALTER TABLE "timesheets" ADD COLUMN "workday_id" text NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidate_blacklists" ADD CONSTRAINT "candidate_blacklists_candidate_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidate_blacklists" ADD CONSTRAINT "candidate_blacklists_company_id_client_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."client_companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_recurrence_day_id_recurrence_days_id_fk" FOREIGN KEY ("recurrence_day_id") REFERENCES "public"."recurrence_days"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_workday_id_workdays_id_fk" FOREIGN KEY ("workday_id") REFERENCES "public"."workdays"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workdays" ADD CONSTRAINT "workdays_recurrence_day_id_recurrence_days_id_fk" FOREIGN KEY ("recurrence_day_id") REFERENCES "public"."recurrence_days"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "workdays" DROP COLUMN IF EXISTS "timesheet_id";--> statement-breakpoint
ALTER TABLE "workdays" DROP COLUMN IF EXISTS "date";--> statement-breakpoint
ALTER TABLE "workdays" DROP COLUMN IF EXISTS "day_start_time";--> statement-breakpoint
ALTER TABLE "workdays" DROP COLUMN IF EXISTS "day_end_time";--> statement-breakpoint
ALTER TABLE "workdays" DROP COLUMN IF EXISTS "lunch_start_time";--> statement-breakpoint
ALTER TABLE "workdays" DROP COLUMN IF EXISTS "lunch_end_time";--> statement-breakpoint
ALTER TABLE "workdays" DROP COLUMN IF EXISTS "hours_worked";--> statement-breakpoint
ALTER TABLE "workdays" DROP COLUMN IF EXISTS "hours_worked_client";--> statement-breakpoint
ALTER TABLE "workdays" DROP COLUMN IF EXISTS "canceled";--> statement-breakpoint
ALTER TABLE "workdays" DROP COLUMN IF EXISTS "filled_out";--> statement-breakpoint
ALTER TABLE "workdays" DROP COLUMN IF EXISTS "time_category";