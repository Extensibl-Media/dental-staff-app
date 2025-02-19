DO $$ BEGIN
 CREATE TYPE "public"."workday_status_enum" AS ENUM('PENDING', 'OPEN', 'FILLED', 'UNFULFILLED', 'CANCELED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DROP TABLE "notifications";--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2024-11-25T01:52:28.255Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2024-11-25T01:52:28.255Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2024-11-25T01:52:28.255Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2024-11-25T01:52:28.255Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2024-11-25T01:52:28.255Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2024-11-25T01:52:28.255Z';--> statement-breakpoint
ALTER TABLE "notification_templates" ADD COLUMN "template" text NOT NULL;--> statement-breakpoint
ALTER TABLE "recurrence_days" ADD COLUMN "status" "workday_status_enum" DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "recurrence_days" ADD COLUMN "archived" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "recurrence_days" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
ALTER TABLE "requisition_application" ADD COLUMN "archived" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "requisition_application" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
ALTER TABLE "notification_templates" DROP COLUMN IF EXISTS "in_app_preview";--> statement-breakpoint
ALTER TABLE "notification_templates" DROP COLUMN IF EXISTS "email_template";--> statement-breakpoint
ALTER TABLE "notification_templates" DROP COLUMN IF EXISTS "sms_template";