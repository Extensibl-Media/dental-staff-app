DO $$ BEGIN
 CREATE TYPE "public"."invoice_source_type" AS ENUM('timesheet', 'manual', 'recurring', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "invoice_status" ADD VALUE 'draft';--> statement-breakpoint
ALTER TYPE "invoice_status" ADD VALUE 'open';--> statement-breakpoint
ALTER TYPE "invoice_status" ADD VALUE 'paid';--> statement-breakpoint
ALTER TYPE "invoice_status" ADD VALUE 'uncollectible';--> statement-breakpoint
ALTER TYPE "invoice_status" ADD VALUE 'void';--> statement-breakpoint
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_candidate_id_candidate_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "created_at" SET DEFAULT '2025-05-12T21:16:25.275Z';--> statement-breakpoint
ALTER TABLE "candidate_discipline_experience" ALTER COLUMN "updated_at" SET DEFAULT '2025-05-12T21:16:25.275Z';--> statement-breakpoint
ALTER TABLE "candidate_document_uploads" ALTER COLUMN "created_at" SET DEFAULT '2025-05-12T21:16:25.275Z';--> statement-breakpoint
ALTER TABLE "candidate_document_uploads" ALTER COLUMN "updated_at" SET DEFAULT '2025-05-12T21:16:25.275Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "created_at" SET DEFAULT '2025-05-12T21:16:25.275Z';--> statement-breakpoint
ALTER TABLE "candidate_profiles" ALTER COLUMN "updated_at" SET DEFAULT '2025-05-12T21:16:25.275Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "created_at" SET DEFAULT '2025-05-12T21:16:25.275Z';--> statement-breakpoint
ALTER TABLE "candidate_ratings" ALTER COLUMN "updated_at" SET DEFAULT '2025-05-12T21:16:25.275Z';--> statement-breakpoint
ALTER TABLE "admin_config" ALTER COLUMN "created_at" SET DEFAULT '2025-05-12T21:16:25.277Z';--> statement-breakpoint
ALTER TABLE "admin_config" ALTER COLUMN "updated_at" SET DEFAULT '2025-05-12T21:16:25.277Z';--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "status" SET DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "candidate_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "requisition_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "timesheet_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "stripe_invoice_id" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "stripe_status" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "stripe_pdf_url" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "stripe_hosted_url" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "source_type" "invoice_source_type" DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "currency" text DEFAULT 'usd' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "amount_due" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "amount_paid" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "amount_remaining" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "subtotal" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "total" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "tax_amount" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "period_start" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "period_end" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "paid_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "voided_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "customer_email" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "customer_name" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "billing_reason" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "collection_method" text DEFAULT 'charge_automatically';--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "footer" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "attempt_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "attempted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "livemode" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "line_items" jsonb DEFAULT '[]';--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "metadata" jsonb DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "custom_fields" jsonb;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "discounts" jsonb DEFAULT '[]';--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "payment_method_types" jsonb;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "default_payment_method" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_candidate_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_source_type_idx" ON "invoices" ("source_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_stripe_invoice_idx" ON "invoices" ("stripe_invoice_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_stripe_customer_idx" ON "invoices" ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_requisition_idx" ON "invoices" ("requisition_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_timesheet_idx" ON "invoices" ("timesheet_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_source_type_status_idx" ON "invoices" ("source_type","status");--> statement-breakpoint
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "paid_date";--> statement-breakpoint
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "total_amount";--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_stripe_invoice_id_unique" UNIQUE("stripe_invoice_id");--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number");