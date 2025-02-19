DO $$ BEGIN
 CREATE TYPE "public"."notification_type" AS ENUM('EMAIL', 'SMS');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2024-10-25T00:56:44.714Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2024-10-25T00:56:44.714Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2024-10-25T00:56:44.714Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2024-10-25T00:56:44.714Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2024-10-25T00:56:44.714Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2024-10-25T00:56:44.714Z';--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "created_at" SET DEFAULT '2024-10-25T00:56:44.719Z';--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "updated_at" SET DEFAULT '2024-10-25T00:56:44.719Z';--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "created_at" SET DEFAULT '2024-10-25T00:56:44.719Z';--> statement-breakpoint
ALTER TABLE "notification_templates" ADD COLUMN "type" "notification_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_templates" ADD COLUMN "in_app_preview" text NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_templates" ADD COLUMN "sms_template" text;--> statement-breakpoint
ALTER TABLE "notification_templates" ADD COLUMN "created_by" text NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_templates" DROP COLUMN IF EXISTS "template";