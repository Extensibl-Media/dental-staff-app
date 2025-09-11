ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2025-08-18T22:34:53.950Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2025-08-18T22:34:53.950Z';--> statement-breakpoint
ALTER TABLE "candidate_document_uploads" ALTER COLUMN "created_at" SET DEFAULT '2025-08-18T22:34:53.950Z';--> statement-breakpoint
ALTER TABLE "candidate_document_uploads" ALTER COLUMN "updated_at" SET DEFAULT '2025-08-18T22:34:53.950Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2025-08-18T22:34:53.950Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2025-08-18T22:34:53.950Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2025-08-18T22:34:53.950Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2025-08-18T22:34:53.950Z';--> statement-breakpoint
ALTER TABLE "client_companies" ALTER COLUMN "operating_hours" SET DEFAULT '{"0":{"openTime":"00:00","closeTime":"00:00","isClosed":false,"timezone":"America/New_York"},"1":{"openTime":"00:00","closeTime":"00:00","isClosed":false,"timezone":"America/New_York"},"2":{"openTime":"00:00","closeTime":"00:00","isClosed":false,"timezone":"America/New_York"},"3":{"openTime":"00:00","closeTime":"00:00","isClosed":false,"timezone":"America/New_York"},"4":{"openTime":"00:00","closeTime":"00:00","isClosed":false,"timezone":"America/New_York"},"5":{"openTime":"00:00","closeTime":"00:00","isClosed":false,"timezone":"America/New_York"},"6":{"openTime":"00:00","closeTime":"00:00","isClosed":false,"timezone":"America/New_York"}}'::jsonb;--> statement-breakpoint
ALTER TABLE "company_office_locations" ALTER COLUMN "operating_hours" SET DEFAULT '{"0":{"openTime":"00:00","closeTime":"00:00","isClosed":false,"timezone":"America/New_York"},"1":{"openTime":"00:00","closeTime":"00:00","isClosed":false,"timezone":"America/New_York"},"2":{"openTime":"00:00","closeTime":"00:00","isClosed":false,"timezone":"America/New_York"},"3":{"openTime":"00:00","closeTime":"00:00","isClosed":false,"timezone":"America/New_York"},"4":{"openTime":"00:00","closeTime":"00:00","isClosed":false,"timezone":"America/New_York"},"5":{"openTime":"00:00","closeTime":"00:00","isClosed":false,"timezone":"America/New_York"},"6":{"openTime":"00:00","closeTime":"00:00","isClosed":false,"timezone":"America/New_York"}}'::jsonb;--> statement-breakpoint
ALTER TABLE "admin_config" ALTER COLUMN "id" SET DEFAULT '69f0d824-1c18-4586-a279-0b820346b1e5';--> statement-breakpoint
ALTER TABLE "admin_config" ALTER COLUMN "created_at" SET DEFAULT '2025-08-18T22:34:53.951Z';--> statement-breakpoint
ALTER TABLE "admin_config" ALTER COLUMN "updated_at" SET DEFAULT '2025-08-18T22:34:53.951Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ADD COLUMN "complete_address" text;--> statement-breakpoint
ALTER TABLE "candidate_profiles" ADD COLUMN "lat" numeric;--> statement-breakpoint
ALTER TABLE "candidate_profiles" ADD COLUMN "lon" numeric;--> statement-breakpoint
ALTER TABLE "company_office_locations" ADD COLUMN "complete_address" text;--> statement-breakpoint
ALTER TABLE "company_office_locations" ADD COLUMN "lat" numeric;--> statement-breakpoint
ALTER TABLE "company_office_locations" ADD COLUMN "lon" numeric;