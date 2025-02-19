DO $$ BEGIN
 CREATE TYPE "public"."invoice_status" AS ENUM('DRAFT', 'PENDING', 'PAID', 'VOID', 'OVERDUE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"status" "invoice_status" DEFAULT 'DRAFT' NOT NULL,
	"due_date" timestamp with time zone,
	"paid_date" timestamp with time zone,
	"total_amount" numeric(10, 2),
	"candidate_id" text NOT NULL,
	"requisition_id" integer NOT NULL,
	"recurrence_day_id" text,
	"client_id" text NOT NULL,
	"workday_id" text NOT NULL,
	"timesheet_id" text NOT NULL,
	CONSTRAINT "invoices_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "timesheets" DROP CONSTRAINT "timesheets_requisition_id_requisitions_id_fk";
--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2025-02-06T00:15:07.782Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2025-02-06T00:15:07.782Z';--> statement-breakpoint
ALTER TABLE "candidate_document_uploads" ALTER COLUMN "created_at" SET DEFAULT '2025-02-06T00:15:07.782Z';--> statement-breakpoint
ALTER TABLE "candidate_document_uploads" ALTER COLUMN "updated_at" SET DEFAULT '2025-02-06T00:15:07.782Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2025-02-06T00:15:07.782Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2025-02-06T00:15:07.782Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2025-02-06T00:15:07.782Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2025-02-06T00:15:07.782Z';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_candidate_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_requisition_id_requisitions_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "public"."requisitions"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_recurrence_day_id_recurrence_days_id_fk" FOREIGN KEY ("recurrence_day_id") REFERENCES "public"."recurrence_days"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_client_profiles_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_workday_id_workdays_id_fk" FOREIGN KEY ("workday_id") REFERENCES "public"."workdays"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_timesheet_id_timesheets_id_fk" FOREIGN KEY ("timesheet_id") REFERENCES "public"."timesheets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_status_idx" ON "invoices" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_candidate_idx" ON "invoices" ("candidate_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_client_idx" ON "invoices" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_due_date_idx" ON "invoices" ("due_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_client_status_idx" ON "invoices" ("client_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_status_due_date_idx" ON "invoices" ("status","due_date");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_requisition_id_requisitions_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "public"."requisitions"("id") ON DELETE set null ON UPDATE set null;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "timesheet_candidate_idx" ON "timesheets" ("associated_candidate_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "timesheet_client_idx" ON "timesheets" ("associated_client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "timesheet_week_begin_idx" ON "timesheets" ("week_begin_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "timesheet_requisition_idx" ON "timesheets" ("requisition_id");