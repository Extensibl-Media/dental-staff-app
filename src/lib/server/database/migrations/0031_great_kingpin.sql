DO $$ BEGIN
 CREATE TYPE "public"."conversation_type" AS ENUM('INTERNAL', 'APPLICATION', 'ADMIN_CLIENT', 'ADMIN_CANDIDATE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."participant_type" AS ENUM('ADMIN', 'CLIENT_STAFF', 'CANDIDATE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2024-10-25T01:11:41.720Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2024-10-25T01:11:41.720Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2024-10-25T01:11:41.720Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2024-10-25T01:11:41.720Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2024-10-25T01:11:41.720Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2024-10-25T01:11:41.720Z';--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD COLUMN "participant_type" "participant_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD COLUMN "left_at" timestamp;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD COLUMN "last_read_message_id" integer;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "type" "conversation_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "application_id" text;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "edited_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "is_system_message" boolean DEFAULT false;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_last_read_message_id_messages_id_fk" FOREIGN KEY ("last_read_message_id") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversations" ADD CONSTRAINT "conversations_application_id_requisition_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."requisition_application"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "participant_user_type_idx" ON "conversation_participants" ("user_id","participant_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "participant_active_conversations_idx" ON "conversation_participants" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversation_type_idx" ON "conversations" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversation_application_idx" ON "conversations" ("application_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversation_updated_at_idx" ON "conversations" ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_conversation_timestamp_idx" ON "messages" ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_sender_idx" ON "messages" ("sender_id");