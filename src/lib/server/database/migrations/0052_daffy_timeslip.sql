DO $$ BEGIN
 CREATE TYPE "public"."admin_payment_fee_type_enum" AS ENUM('PERCENTAGE', 'FIXED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_config" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT '2025-05-12T21:02:14.290Z' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT '2025-05-12T21:02:14.290Z' NOT NULL,
	"admin_payment_fee" smallint DEFAULT 0 NOT NULL,
	"admin_payment_fee_type" "admin_payment_fee_type_enum" DEFAULT 'PERCENTAGE' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "stripe-_customer_id" TO "stripe_customer_id";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_stripe-_customer_id_unique";--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2025-05-12T21:02:14.289Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2025-05-12T21:02:14.289Z';--> statement-breakpoint
ALTER TABLE "candidate_document_uploads" ALTER COLUMN "created_at" SET DEFAULT '2025-05-12T21:02:14.289Z';--> statement-breakpoint
ALTER TABLE "candidate_document_uploads" ALTER COLUMN "updated_at" SET DEFAULT '2025-05-12T21:02:14.289Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2025-05-12T21:02:14.289Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2025-05-12T21:02:14.289Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2025-05-12T21:02:14.289Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2025-05-12T21:02:14.289Z';--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_stripe_customer_id_unique" UNIQUE("stripe_customer_id");