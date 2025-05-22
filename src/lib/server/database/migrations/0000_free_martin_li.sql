DO $$ BEGIN
 CREATE TYPE "public"."support_ticket_status" AS ENUM('NEW', 'PENDING', 'CLOSED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."user_roles" AS ENUM('SUPERADMIN', 'CLIENT', 'CLIENT_STAFF', 'CANDIDATE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."candidate_document_type" AS ENUM('RESUME', 'LICENSE', 'CERTIFICATE', 'OTHER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."candidate_status" AS ENUM('INACTIVE', 'PENDING', 'ACTIVE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."staff_roles" AS ENUM('CLIENT_ADMIN', 'CLIENT_MANAGER', 'CLIENT_EMPLOYEE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."admin_payment_fee_type_enum" AS ENUM('PERCENTAGE', 'FIXED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."conversation_type" AS ENUM('INTERNAL', 'APPLICATION', 'ADMIN_CLIENT', 'ADMIN_CANDIDATE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."message_status" AS ENUM('READ', 'UNREAD');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."notification_type" AS ENUM('EMAIL', 'SMS');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."in_app_notification_status" AS ENUM('UNREAD', 'READ');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."invoice_source_type" AS ENUM('timesheet', 'manual', 'recurring', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'open', 'paid', 'uncollectible', 'void');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."workday_status_enum" AS ENUM('OPEN', 'FILLED', 'UNFULFILLED', 'CANCELED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."requisition_application_status" AS ENUM('PENDING', 'APPROVED', 'DENIED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
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
DO $$ BEGIN
 CREATE TYPE "public"."timesheet_status" AS ENUM('PENDING', 'APPROVED', 'DISCREPANCY', 'REJECTED', 'VOID');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "action_history" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"entity_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"changes" jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_note_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"admin_note_id" text NOT NULL,
	"created_by_id" text NOT NULL,
	"body" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"created_by_id" text NOT NULL,
	"for_user_id" text NOT NULL,
	"body" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "support_ticket_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"support_ticket_id" text NOT NULL,
	"from_id" text NOT NULL,
	"comment_body" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "support_tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"additional_notes" text,
	"closed_by_id" text,
	"reported_by" text NOT NULL,
	"resolution_details" text,
	"steps_to_reproduce" text,
	"expected_result" text,
	"actual_result" text,
	"status" "support_ticket_status" DEFAULT 'NEW',
	"title" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff_invite_locations" (
	"token" text,
	"location_id" text NOT NULL,
	"is_primary" boolean DEFAULT true NOT NULL,
	CONSTRAINT "staff_invite_locations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
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
	"staff_role" text,
	"company_id" text,
	CONSTRAINT "user_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text DEFAULT 'email' NOT NULL,
	"provider_id" text DEFAULT '' NOT NULL,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"avatar_url" text,
	"role" text DEFAULT 'CANDIDATE' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"receive_email" boolean DEFAULT true NOT NULL,
	"password" text,
	"token" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"completed_onboarding" boolean DEFAULT false,
	"onboarding_step" integer DEFAULT 1,
	"blacklisted" boolean DEFAULT false,
	"stripe_customer_id" text,
	"timezone" text DEFAULT 'America/New_York',
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_token_unique" UNIQUE("token"),
	CONSTRAINT "users_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "candidate_blacklists" (
	"candidate_id" text NOT NULL,
	"company_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "candidate_blacklists_candidate_id_company_id_pk" PRIMARY KEY("candidate_id","company_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "candidate_discipline_experience" (
	"created_at" timestamp with time zone DEFAULT '2025-05-21T16:17:51.504Z' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT '2025-05-21T16:17:51.504Z' NOT NULL,
	"candidate_id" text NOT NULL,
	"experience_level_id" text NOT NULL,
	"discipline_id" text NOT NULL,
	CONSTRAINT "candidate_discipline_experience_candidate_id_discipline_id_pk" PRIMARY KEY("candidate_id","discipline_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "candidate_document_uploads" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT '2025-05-21T16:17:51.504Z' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT '2025-05-21T16:17:51.504Z' NOT NULL,
	"candidate_id" text NOT NULL,
	"upload_url" text NOT NULL,
	"expiry_date" timestamp with time zone,
	"type" "candidate_document_type" NOT NULL,
	"filename" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "candidate_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT '2025-05-21T16:17:51.504Z' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT '2025-05-21T16:17:51.504Z' NOT NULL,
	"address" text,
	"hourly_rate_min" smallint NOT NULL,
	"hourly_rate_max" smallint NOT NULL,
	"candidate_status" "candidate_status" DEFAULT 'PENDING',
	"city" text,
	"state" text,
	"zipcode" text,
	"employee_number" text,
	"cell_phone" text,
	"citizenship" text,
	"birthday" date,
	"avg_rating" smallint DEFAULT 0,
	"region_id" text,
	"feature_me" boolean DEFAULT false,
	"approved" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "candidate_ratings" (
	"id" text PRIMARY KEY NOT NULL,
	"candidate_id" text NOT NULL,
	"rated_by_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT '2025-05-21T16:17:51.504Z' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT '2025-05-21T16:17:51.504Z' NOT NULL,
	"notes" text,
	"rating" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_companies" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"company_name" text,
	"license_number" text,
	"company_logo" text,
	"company_description" text,
	"base_location" text,
	"operating_hours" jsonb DEFAULT '{"0":{"openTime":"00:00:00Z","closeTime":"00:00:00Z","isClosed":false,"timezone":"America/New_York"},"1":{"openTime":"00:00:00Z","closeTime":"00:00:00Z","isClosed":false,"timezone":"America/New_York"},"2":{"openTime":"00:00:00Z","closeTime":"00:00:00Z","isClosed":false,"timezone":"America/New_York"},"3":{"openTime":"00:00:00Z","closeTime":"00:00:00Z","isClosed":false,"timezone":"America/New_York"},"4":{"openTime":"00:00:00Z","closeTime":"00:00:00Z","isClosed":false,"timezone":"America/New_York"},"5":{"openTime":"00:00:00Z","closeTime":"00:00:00Z","isClosed":false,"timezone":"America/New_York"},"6":{"openTime":"00:00:00Z","closeTime":"00:00:00Z","isClosed":false,"timezone":"America/New_York"}}'::jsonb,
	CONSTRAINT "client_companies_license_number_unique" UNIQUE("license_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"birthday" date
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_ratings" (
	"id" text PRIMARY KEY NOT NULL,
	"client_company_id" text NOT NULL,
	"rated_by_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"rating" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_staff_locations" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"company_id" text NOT NULL,
	"staff_id" text NOT NULL,
	"location_id" text NOT NULL,
	"is_primary_location" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_staff" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"client_id" text NOT NULL,
	"company_id" text NOT NULL,
	"staff_role" "staff_roles" DEFAULT 'CLIENT_EMPLOYEE',
	"birthday" date
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"subscription_status" text,
	"stripe_customer_id" text,
	"price_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "company_office_locations" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"location_name" text NOT NULL,
	"street_one" text,
	"street_two" text,
	"city" text,
	"state" text,
	"zipcode" text,
	"company_phone" text,
	"cell_phone" text,
	"operating_hours" jsonb DEFAULT '{"0":{"openTime":"00:00:00Z","closeTime":"00:00:00Z","isClosed":false,"timezone":"America/New_York"},"1":{"openTime":"00:00:00Z","closeTime":"00:00:00Z","isClosed":false,"timezone":"America/New_York"},"2":{"openTime":"00:00:00Z","closeTime":"00:00:00Z","isClosed":false,"timezone":"America/New_York"},"3":{"openTime":"00:00:00Z","closeTime":"00:00:00Z","isClosed":false,"timezone":"America/New_York"},"4":{"openTime":"00:00:00Z","closeTime":"00:00:00Z","isClosed":false,"timezone":"America/New_York"},"5":{"openTime":"00:00:00Z","closeTime":"00:00:00Z","isClosed":false,"timezone":"America/New_York"},"6":{"openTime":"00:00:00Z","closeTime":"00:00:00Z","isClosed":false,"timezone":"America/New_York"}}'::jsonb,
	"email" text,
	"region_id" text,
	"timezone" text DEFAULT 'America/New_York' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_config" (
	"id" text PRIMARY KEY DEFAULT 'fdab00b3-bdfb-4e70-8587-048bbe847383' NOT NULL,
	"created_at" timestamp with time zone DEFAULT '2025-05-21T16:17:51.507Z' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT '2025-05-21T16:17:51.507Z' NOT NULL,
	"admin_payment_fee" smallint DEFAULT 0 NOT NULL,
	"admin_payment_fee_type" "admin_payment_fee_type_enum" DEFAULT 'PERCENTAGE' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversation_participants" (
	"conversation_id" text NOT NULL,
	"user_id" text NOT NULL,
	"participant_type" "user_roles" NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_read_message_id" integer,
	CONSTRAINT "conversation_participants_conversation_id_user_id_pk" PRIMARY KEY("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "conversation_type" NOT NULL,
	"application_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_message_id" integer,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"body" text NOT NULL,
	"status" "message_status" DEFAULT 'UNREAD',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"edited_at" timestamp with time zone,
	"is_system_message" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "notification_type" NOT NULL,
	"template" text NOT NULL,
	"required_sources" jsonb NOT NULL,
	"email_subject" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "in_app_notifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"message" text NOT NULL,
	"status" "in_app_notification_status" DEFAULT 'UNREAD' NOT NULL,
	"resource_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"read_at" timestamp with time zone,
	"batch_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "referral_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"blocked" boolean DEFAULT false,
	"referral_code" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "regions" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"name" text NOT NULL,
	"abbreviation" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subregion" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"region_id" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subregion_zipcodes" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"code" text NOT NULL,
	"subregion_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "candidate_saved_requisitions" (
	"candidate_id" text NOT NULL,
	"requisition_id" integer NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "candidate_saved_requisitions_candidate_id_requisition_id_pk" PRIMARY KEY("candidate_id","requisition_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"stripe_invoice_id" text,
	"stripe_customer_id" text,
	"stripe_status" text,
	"stripe_pdf_url" text,
	"stripe_hosted_url" text,
	"invoice_number" text NOT NULL,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"source_type" "invoice_source_type" DEFAULT 'manual' NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"amount_due" numeric(10, 2) DEFAULT '0' NOT NULL,
	"amount_paid" numeric(10, 2) DEFAULT '0' NOT NULL,
	"amount_remaining" numeric(10, 2) DEFAULT '0' NOT NULL,
	"subtotal" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"due_date" timestamp with time zone,
	"period_start" timestamp with time zone,
	"period_end" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"voided_at" timestamp with time zone,
	"client_id" text NOT NULL,
	"customer_email" text,
	"customer_name" text,
	"candidate_id" text,
	"requisition_id" integer,
	"timesheet_id" text,
	"billing_reason" text,
	"collection_method" text DEFAULT 'send_invoice',
	"description" text,
	"footer" text,
	"attempt_count" integer DEFAULT 0,
	"attempted" boolean DEFAULT false,
	"livemode" boolean DEFAULT false,
	"line_items" jsonb DEFAULT '[]',
	"metadata" jsonb DEFAULT '{}',
	"custom_fields" jsonb,
	"discounts" jsonb DEFAULT '[]',
	"payment_method_types" jsonb,
	"default_payment_method" text,
	CONSTRAINT "invoices_id_unique" UNIQUE("id"),
	CONSTRAINT "invoices_stripe_invoice_id_unique" UNIQUE("stripe_invoice_id"),
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recurrence_days" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"status" "workday_status_enum" DEFAULT 'OPEN' NOT NULL,
	"date" date NOT NULL,
	"day_start_time" timestamp with time zone NOT NULL,
	"day_end_time" timestamp with time zone NOT NULL,
	"lunch_start_time" timestamp with time zone NOT NULL,
	"lunch_end_time" timestamp with time zone NOT NULL,
	"requisition_id" integer,
	"archived" boolean DEFAULT false,
	"archived_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "requisition_application" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"client_id" text NOT NULL,
	"requisition_id" integer NOT NULL,
	"candidate_id" text NOT NULL,
	"application_status" "requisition_application_status" DEFAULT 'PENDING',
	"archived" boolean DEFAULT false,
	"archived_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "requisitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"status" "requisition_status_enum" DEFAULT 'PENDING' NOT NULL,
	"name" text NOT NULL,
	"client_id" text NOT NULL,
	"location_id" text NOT NULL,
	"discipline_id" text NOT NULL,
	"job_description" text NOT NULL,
	"special_instructions" text,
	"experience_level_id" text,
	"archived" boolean DEFAULT false,
	"archived_at" timestamp with time zone,
	"hourly_rate" smallint,
	"permanent_position" boolean DEFAULT false,
	"reference_timezone" text DEFAULT 'America/New_York' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "timesheets" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"associated_client_id" text NOT NULL,
	"associated_candidate_id" text NOT NULL,
	"validated" boolean DEFAULT false,
	"total_hours_worked" numeric,
	"total_hours_billed" numeric,
	"awaiting_client_signature" boolean DEFAULT true,
	"candidate_rate_base" numeric,
	"candidate_rate_overtime" numeric,
	"requisition_id" integer,
	"workday_id" text NOT NULL,
	"week_begin_date" date NOT NULL,
	"hours_raw" json DEFAULT '[]'::json NOT NULL,
	"status" "timesheet_status" DEFAULT 'PENDING' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workdays" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"candidate_id" text NOT NULL,
	"requisition_id" integer NOT NULL,
	"recurrence_day_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "disciplines" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"name" text NOT NULL,
	"abbreviation" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "experience_levels" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "skill_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "skills" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"category_id" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "action_history" ADD CONSTRAINT "action_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_note_comments" ADD CONSTRAINT "admin_note_comments_admin_note_id_admin_notes_id_fk" FOREIGN KEY ("admin_note_id") REFERENCES "public"."admin_notes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_note_comments" ADD CONSTRAINT "admin_note_comments_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_for_user_id_users_id_fk" FOREIGN KEY ("for_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "support_ticket_comments" ADD CONSTRAINT "support_ticket_comments_support_ticket_id_support_tickets_id_fk" FOREIGN KEY ("support_ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "support_ticket_comments" ADD CONSTRAINT "support_ticket_comments_from_id_users_id_fk" FOREIGN KEY ("from_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_closed_by_id_users_id_fk" FOREIGN KEY ("closed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidate_blacklists" ADD CONSTRAINT "candidate_blacklists_candidate_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidate_blacklists" ADD CONSTRAINT "candidate_blacklists_company_id_client_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."client_companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidate_discipline_experience" ADD CONSTRAINT "candidate_discipline_experience_candidate_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidate_discipline_experience" ADD CONSTRAINT "candidate_discipline_experience_experience_level_id_experience_levels_id_fk" FOREIGN KEY ("experience_level_id") REFERENCES "public"."experience_levels"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidate_discipline_experience" ADD CONSTRAINT "candidate_discipline_experience_discipline_id_disciplines_id_fk" FOREIGN KEY ("discipline_id") REFERENCES "public"."disciplines"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidate_document_uploads" ADD CONSTRAINT "candidate_document_uploads_candidate_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidate_ratings" ADD CONSTRAINT "candidate_ratings_candidate_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidate_ratings" ADD CONSTRAINT "candidate_ratings_rated_by_id_client_companies_id_fk" FOREIGN KEY ("rated_by_id") REFERENCES "public"."client_companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_companies" ADD CONSTRAINT "client_companies_client_id_client_profiles_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_ratings" ADD CONSTRAINT "client_ratings_client_company_id_client_companies_id_fk" FOREIGN KEY ("client_company_id") REFERENCES "public"."client_companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_ratings" ADD CONSTRAINT "client_ratings_rated_by_id_candidate_profiles_id_fk" FOREIGN KEY ("rated_by_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_staff_locations" ADD CONSTRAINT "client_staff_locations_company_id_client_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."client_companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_staff_locations" ADD CONSTRAINT "client_staff_locations_staff_id_client_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."client_staff"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_staff_locations" ADD CONSTRAINT "client_staff_locations_location_id_company_office_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."company_office_locations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_staff" ADD CONSTRAINT "client_staff_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_staff" ADD CONSTRAINT "client_staff_client_id_client_profiles_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_staff" ADD CONSTRAINT "client_staff_company_id_client_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."client_companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_subscriptions" ADD CONSTRAINT "client_subscriptions_client_id_client_profiles_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "company_office_locations" ADD CONSTRAINT "company_office_locations_company_id_client_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."client_companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "company_office_locations" ADD CONSTRAINT "company_office_locations_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_last_read_message_id_messages_id_fk" FOREIGN KEY ("last_read_message_id") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversations" ADD CONSTRAINT "conversations_application_id_requisition_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."requisition_application"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subregion" ADD CONSTRAINT "subregion_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subregion_zipcodes" ADD CONSTRAINT "subregion_zipcodes_subregion_id_subregion_id_fk" FOREIGN KEY ("subregion_id") REFERENCES "public"."subregion"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidate_saved_requisitions" ADD CONSTRAINT "candidate_saved_requisitions_candidate_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidate_saved_requisitions" ADD CONSTRAINT "candidate_saved_requisitions_requisition_id_requisitions_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "public"."requisitions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_client_profiles_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client_profiles"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_candidate_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_requisition_id_requisitions_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "public"."requisitions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_timesheet_id_timesheets_id_fk" FOREIGN KEY ("timesheet_id") REFERENCES "public"."timesheets"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recurrence_days" ADD CONSTRAINT "recurrence_days_requisition_id_requisitions_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "public"."requisitions"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "requisition_application" ADD CONSTRAINT "requisition_application_client_id_client_profiles_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "requisition_application" ADD CONSTRAINT "requisition_application_requisition_id_requisitions_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "public"."requisitions"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "requisition_application" ADD CONSTRAINT "requisition_application_candidate_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_client_id_client_companies_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client_companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_location_id_company_office_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."company_office_locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_discipline_id_disciplines_id_fk" FOREIGN KEY ("discipline_id") REFERENCES "public"."disciplines"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_experience_level_id_experience_levels_id_fk" FOREIGN KEY ("experience_level_id") REFERENCES "public"."experience_levels"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_associated_client_id_client_profiles_id_fk" FOREIGN KEY ("associated_client_id") REFERENCES "public"."client_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_associated_candidate_id_candidate_profiles_id_fk" FOREIGN KEY ("associated_candidate_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_requisition_id_requisitions_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "public"."requisitions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_workday_id_workdays_id_fk" FOREIGN KEY ("workday_id") REFERENCES "public"."workdays"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workdays" ADD CONSTRAINT "workdays_candidate_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workdays" ADD CONSTRAINT "workdays_requisition_id_requisitions_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "public"."requisitions"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workdays" ADD CONSTRAINT "workdays_recurrence_day_id_recurrence_days_id_fk" FOREIGN KEY ("recurrence_day_id") REFERENCES "public"."recurrence_days"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "skills" ADD CONSTRAINT "skills_category_id_skill_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."skill_categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "participant_user_type_idx" ON "conversation_participants" ("user_id","participant_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "participant_active_conversations_idx" ON "conversation_participants" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversation_type_idx" ON "conversations" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversation_application_idx" ON "conversations" ("application_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversation_updated_at_idx" ON "conversations" ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_conversation_timestamp_idx" ON "messages" ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_sender_idx" ON "messages" ("sender_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_status_idx" ON "invoices" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_source_type_idx" ON "invoices" ("source_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_client_idx" ON "invoices" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_due_date_idx" ON "invoices" ("due_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_stripe_invoice_idx" ON "invoices" ("stripe_invoice_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_stripe_customer_idx" ON "invoices" ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_candidate_idx" ON "invoices" ("candidate_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_requisition_idx" ON "invoices" ("requisition_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_timesheet_idx" ON "invoices" ("timesheet_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_client_status_idx" ON "invoices" ("client_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_status_due_date_idx" ON "invoices" ("status","due_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_source_type_status_idx" ON "invoices" ("source_type","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "timesheet_candidate_idx" ON "timesheets" ("associated_candidate_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "timesheet_client_idx" ON "timesheets" ("associated_client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "timesheet_week_begin_idx" ON "timesheets" ("week_begin_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "timesheet_requisition_idx" ON "timesheets" ("requisition_id");