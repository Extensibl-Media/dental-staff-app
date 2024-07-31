ALTER TYPE "user_roles" ADD VALUE 'ADMIN';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_invites" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"referrer_role" "user_roles" NOT NULL,
	"referrer_id" text NOT NULL,
	"user_role" text NOT NULL,
	CONSTRAINT "user_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2024-07-08T14:23:40.349Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2024-07-08T14:23:40.349Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2024-07-08T14:23:40.349Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2024-07-08T14:23:40.349Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2024-07-08T14:23:40.349Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2024-07-08T14:23:40.349Z';--> statement-breakpoint
ALTER TABLE "client_companies" ADD COLUMN "company_logo" text;