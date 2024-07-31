ALTER TABLE "requisitions" RENAME COLUMN "ciscipline_id" TO "discipline_id";--> statement-breakpoint
ALTER TABLE "requisitions" DROP CONSTRAINT "requisitions_ciscipline_id_disciplines_id_fk";
--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2024-06-17T20:16:00.309Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2024-06-17T20:16:00.309Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2024-06-17T20:16:00.308Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2024-06-17T20:16:00.308Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2024-06-17T20:16:00.309Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2024-06-17T20:16:00.309Z';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_discipline_id_disciplines_id_fk" FOREIGN KEY ("discipline_id") REFERENCES "public"."disciplines"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
