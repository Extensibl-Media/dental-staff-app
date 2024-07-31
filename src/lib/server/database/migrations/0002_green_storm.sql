DO $$ BEGIN
 CREATE TYPE "public"."requisition_status_enum" AS ENUM('PENDING', 'OPEN', 'FILLED', 'UNFULFILLED', 'CANCELED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."time_category_enum" AS ENUM('R', 'PTO', 'UPTO', 'H', 'OT', 'EXREIM', 'ME');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" DROP CONSTRAINT "candidate_discipline_experience_candidate_id_candidate_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "requisitions" DROP CONSTRAINT "requisitions_client_id_client_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2024-06-11T04:01:30.184Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2024-06-11T04:01:30.184Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2024-06-11T04:01:30.184Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2024-06-11T04:01:30.184Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2024-06-11T04:01:30.184Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2024-06-11T04:01:30.184Z';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidate_discipline_experience" ADD CONSTRAINT "candidate_discipline_experience_candidate_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_client_id_client_companies_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client_companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
