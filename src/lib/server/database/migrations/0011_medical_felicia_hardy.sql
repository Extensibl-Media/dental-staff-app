ALTER TABLE "conversation_participants" DROP CONSTRAINT "conversation_participants_conversation_id_conversations_id_fk";
--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2024-07-17T03:30:33.804Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2024-07-17T03:30:33.804Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2024-07-17T03:30:33.804Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2024-07-17T03:30:33.804Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2024-07-17T03:30:33.804Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2024-07-17T03:30:33.804Z';--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "created_at" SET DEFAULT '2024-07-17T03:30:33.817Z';--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "updated_at" SET DEFAULT '2024-07-17T03:30:33.817Z';--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "created_at" SET DEFAULT '2024-07-17T03:30:33.818Z';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
