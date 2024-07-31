DO $$ BEGIN
 CREATE TYPE "public"."message_status" AS ENUM('READ', 'UNREAD');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2024-07-10T16:00:40.030Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2024-07-10T16:00:40.030Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2024-07-10T16:00:40.030Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2024-07-10T16:00:40.030Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2024-07-10T16:00:40.030Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2024-07-10T16:00:40.030Z';--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "created_at" SET DEFAULT '2024-07-10T16:00:40.034Z';--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "updated_at" SET DEFAULT '2024-07-10T16:00:40.034Z';--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "last_message_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "created_at" SET DEFAULT '2024-07-10T16:00:40.034Z';