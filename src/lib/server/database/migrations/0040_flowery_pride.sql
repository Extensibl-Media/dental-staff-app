ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2024-12-31T00:58:58.650Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2024-12-31T00:58:58.650Z';--> statement-breakpoint
ALTER TABLE "candidate_document_uploads" ALTER COLUMN "created_at" SET DEFAULT '2024-12-31T00:58:58.650Z';--> statement-breakpoint
ALTER TABLE "candidate_document_uploads" ALTER COLUMN "updated_at" SET DEFAULT '2024-12-31T00:58:58.650Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2024-12-31T00:58:58.650Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2024-12-31T00:58:58.650Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2024-12-31T00:58:58.650Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2024-12-31T00:58:58.650Z';--> statement-breakpoint
ALTER TABLE "action_history" ADD COLUMN "entity_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "action_history" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "action_history" ADD COLUMN "action" text NOT NULL;--> statement-breakpoint
ALTER TABLE "action_history" ADD COLUMN "changes" jsonb;--> statement-breakpoint
ALTER TABLE "action_history" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "action_history" ADD CONSTRAINT "action_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
