ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2024-08-17T02:40:03.300Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2024-08-17T02:40:03.300Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2024-08-17T02:40:03.300Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2024-08-17T02:40:03.300Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2024-08-17T02:40:03.300Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2024-08-17T02:40:03.300Z';--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "created_at" SET DEFAULT '2024-08-17T02:40:03.304Z';--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "updated_at" SET DEFAULT '2024-08-17T02:40:03.304Z';--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "created_at" SET DEFAULT '2024-08-17T02:40:03.304Z';--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "title" text NOT NULL;