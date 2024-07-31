ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2024-06-11T04:54:17.905Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2024-06-11T04:54:17.905Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2024-06-11T04:54:17.905Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2024-06-11T04:54:17.905Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2024-06-11T04:54:17.905Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2024-06-11T04:54:17.905Z';--> statement-breakpoint
ALTER TABLE "recurrence_days" ADD COLUMN "id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "recurrence_days" ADD COLUMN "created_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "recurrence_days" ADD COLUMN "updated_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "recurrence_days" ADD COLUMN "timesheet_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "recurrence_days" ADD COLUMN "date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "recurrence_days" ADD COLUMN "day_start_time" time with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "recurrence_days" ADD COLUMN "day_end_time" time with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "recurrence_days" ADD COLUMN "lunch_start_time" time with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "recurrence_days" ADD COLUMN "lunch_end_time" time with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "recurrence_days" ADD COLUMN "requisition_id" integer;--> statement-breakpoint
ALTER TABLE "timesheets" ADD COLUMN "requisition_id" integer;--> statement-breakpoint
ALTER TABLE "workdays" ADD COLUMN "candidate_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "workdays" ADD COLUMN "requisition_id" integer NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recurrence_days" ADD CONSTRAINT "recurrence_days_timesheet_id_timesheets_id_fk" FOREIGN KEY ("timesheet_id") REFERENCES "public"."timesheets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recurrence_days" ADD CONSTRAINT "recurrence_days_requisition_id_requisitions_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "public"."requisitions"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_requisition_id_requisitions_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "public"."requisitions"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workdays" ADD CONSTRAINT "workdays_candidate_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workdays" ADD CONSTRAINT "workdays_requisition_id_requisitions_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "public"."requisitions"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
