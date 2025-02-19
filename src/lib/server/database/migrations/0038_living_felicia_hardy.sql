DO $$ BEGIN
 CREATE TYPE "public"."in_app_notification_status" AS ENUM('UNREAD', 'READ');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "candidate_document_uploads" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT '2024-12-23T02:15:24.101Z' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT '2024-12-23T02:15:24.101Z' NOT NULL,
	"candidate_id" text NOT NULL,
	"upload_url" text NOT NULL,
	"expiry_date" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "in_app_notifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"message" text NOT NULL,
	"status" "in_app_notification_status" DEFAULT 'UNREAD' NOT NULL,
	"resource_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"read_at" timestamp with time zone,
	"batch_id" text
);
--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2024-12-23T02:15:24.101Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2024-12-23T02:15:24.101Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2024-12-23T02:15:24.100Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2024-12-23T02:15:24.100Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2024-12-23T02:15:24.100Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2024-12-23T02:15:24.100Z';--> statement-breakpoint
ALTER TABLE "requisition_application" ADD COLUMN "client_id" text NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidate_document_uploads" ADD CONSTRAINT "candidate_document_uploads_candidate_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "requisition_application" ADD CONSTRAINT "requisition_application_client_id_client_profiles_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
