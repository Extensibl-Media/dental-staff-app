ALTER TYPE "public"."timesheet_status" ADD VALUE 'DRAFT' BEFORE 'PENDING';--> statement-breakpoint
DROP INDEX "participant_active_conversations_idx";--> statement-breakpoint
DROP INDEX "conversation_updated_at_idx";--> statement-breakpoint
DROP INDEX "message_conversation_timestamp_idx";--> statement-breakpoint
DROP INDEX "invoice_candidate_idx";--> statement-breakpoint
DROP INDEX "invoice_requisition_idx";--> statement-breakpoint
DROP INDEX "invoice_timesheet_idx";--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2025-11-06T04:36:49.124Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2025-11-06T04:36:49.124Z';--> statement-breakpoint
ALTER TABLE "candidate_document_uploads" ALTER COLUMN "created_at" SET DEFAULT '2025-11-06T04:36:49.124Z';--> statement-breakpoint
ALTER TABLE "candidate_document_uploads" ALTER COLUMN "updated_at" SET DEFAULT '2025-11-06T04:36:49.124Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2025-11-06T04:36:49.124Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2025-11-06T04:36:49.124Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2025-11-06T04:36:49.124Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2025-11-06T04:36:49.124Z';--> statement-breakpoint
ALTER TABLE "admin_config" ALTER COLUMN "id" SET DEFAULT '3764373b-ebeb-47e3-a2f2-adbc94cda852';--> statement-breakpoint
ALTER TABLE "admin_config" ALTER COLUMN "created_at" SET DEFAULT '2025-11-06T04:36:49.126Z';--> statement-breakpoint
ALTER TABLE "admin_config" ALTER COLUMN "updated_at" SET DEFAULT '2025-11-06T04:36:49.126Z';--> statement-breakpoint
CREATE INDEX "participant_active_conversations_idx" ON "conversation_participants" USING btree ("user_id") WHERE "conversation_participants"."is_active" = true;--> statement-breakpoint
CREATE INDEX "conversation_updated_at_idx" ON "conversations" USING btree ("updated_at" desc);--> statement-breakpoint
CREATE INDEX "message_conversation_timestamp_idx" ON "messages" USING btree ("conversation_id","created_at" desc);--> statement-breakpoint
CREATE INDEX "invoice_candidate_idx" ON "invoices" USING btree ("candidate_id") WHERE candidate_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "invoice_requisition_idx" ON "invoices" USING btree ("requisition_id") WHERE requisition_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "invoice_timesheet_idx" ON "invoices" USING btree ("timesheet_id") WHERE timesheet_id IS NOT NULL;