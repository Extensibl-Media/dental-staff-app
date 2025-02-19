ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2024-10-04T02:10:03.680Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2024-10-04T02:10:03.680Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2024-10-04T02:10:03.680Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2024-10-04T02:10:03.680Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2024-10-04T02:10:03.680Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2024-10-04T02:10:03.680Z';--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "created_at" SET DEFAULT '2024-10-04T02:10:03.683Z';--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "updated_at" SET DEFAULT '2024-10-04T02:10:03.683Z';--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "created_at" SET DEFAULT '2024-10-04T02:10:03.684Z';--> statement-breakpoint
ALTER TABLE "requisitions" ADD COLUMN "hourly_rate" smallint;--> statement-breakpoint
ALTER TABLE "requisitions" ADD COLUMN "permanent_position" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "workdays" ADD COLUMN "recurrence_day_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workdays" ADD CONSTRAINT "workdays_recurrence_day_id_recurrence_days_id_fk" FOREIGN KEY ("recurrence_day_id") REFERENCES "public"."recurrence_days"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
