ALTER TABLE "messages" DROP CONSTRAINT "messages_sender_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2024-07-17T05:42:18.719Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2024-07-17T05:42:18.719Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2024-07-17T05:42:18.719Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2024-07-17T05:42:18.719Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2024-07-17T05:42:18.719Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2024-07-17T05:42:18.719Z';--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "created_at" SET DEFAULT '2024-07-17T05:42:18.724Z';--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "updated_at" SET DEFAULT '2024-07-17T05:42:18.724Z';--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "created_at" SET DEFAULT '2024-07-17T05:42:18.724Z';