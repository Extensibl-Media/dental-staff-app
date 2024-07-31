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
CREATE TABLE IF NOT EXISTS "action_history" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"entity_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_note_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"admin_note_id" text NOT NULL,
	"created_by_id" text NOT NULL,
	"body" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"title" text NOT NULL,
	"created_by_id" text NOT NULL,
	"for_user_id" text NOT NULL,
	"body" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "support_tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"closed_at" timestamp with time zone NOT NULL,
	"additional_notes" text,
	"closed_by_id" text,
	"reported_by" text NOT NULL,
	"resolution_details" text,
	"steps_to_reproduce" text,
	"expected_result" text,
	"actual_result" text,
	"status" "support_ticket_status" DEFAULT 'NEW'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
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
	"blacklisted" boolean DEFAULT false,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "candidate_discipline_experience" (
	"created_at" timestamp with time zone DEFAULT '2024-06-07T04:58:12.811Z' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT '2024-06-07T04:58:12.811Z' NOT NULL,
	"candidate_id" text NOT NULL,
	"experience_level_id" text NOT NULL,
	"discipline_id" text NOT NULL,
	CONSTRAINT "candidate_discipline_experience_candidate_id_discipline_id_pk" PRIMARY KEY("candidate_id","discipline_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "candidate_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT '2024-06-07T04:58:12.811Z' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT '2024-06-07T04:58:12.811Z' NOT NULL,
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
	"feature_me" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "candidate_ratings" (
	"id" text PRIMARY KEY NOT NULL,
	"candidate_id" text NOT NULL,
	"rated_by_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT '2024-06-07T04:58:12.811Z' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT '2024-06-07T04:58:12.811Z' NOT NULL,
	"notes" text,
	"rating" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_companies" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"company_name" text,
	"license_number" text,
	CONSTRAINT "client_companies_license_number_unique" UNIQUE("license_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"birthday" date
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_ratings" (
	"id" text PRIMARY KEY NOT NULL,
	"client_company_id" text NOT NULL,
	"rated_by_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"notes" text,
	"rating" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_staff_locations" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"company_id" text NOT NULL,
	"primary_location_id" text NOT NULL,
	"is_primary_location" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_staff" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
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
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"subscription_status" text,
	"stripe_customer_id" text,
	"price_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "company_office_locations" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"location_name" text NOT NULL,
	"street_one" text,
	"street_two" text,
	"city" text,
	"state" text,
	"zipcode" text,
	"company_phone" text,
	"cell_phone" text,
	"hours_of_operation" text,
	"email" text,
	"region_id" text
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
CREATE TABLE IF NOT EXISTS "calendar_days" (

);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoices" (

);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recurrence_days" (

);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "requisitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"status" "requisition_status_enum" DEFAULT 'OPEN' NOT NULL,
	"name" text NOT NULL,
	"client_id" text NOT NULL,
	"location_id" text NOT NULL,
	"ciscipline_id" text NOT NULL,
	"job_description" text NOT NULL,
	"special_instructions" text,
	"experience_level_id" text
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
	"candidate_rate_base" smallint,
	"candidate_rate_overtime" smallint
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workdays" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"timesheet_id" text NOT NULL,
	"date" date NOT NULL,
	"day_start_time" time with time zone NOT NULL,
	"day_end_time" time with time zone NOT NULL,
	"lunch_start_time" time with time zone NOT NULL,
	"lunch_end_time" time with time zone NOT NULL,
	"hours_worked" smallint NOT NULL,
	"hours_worked_client" smallint NOT NULL,
	"canceled" boolean DEFAULT false,
	"filled_out" boolean DEFAULT false,
	"time_category" "time_category_enum"
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
 ALTER TABLE "candidate_discipline_experience" ADD CONSTRAINT "candidate_discipline_experience_candidate_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidate_discipline_experience" ADD CONSTRAINT "candidate_discipline_experience_experience_level_id_experience_levels_id_fk" FOREIGN KEY ("experience_level_id") REFERENCES "public"."experience_levels"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidate_discipline_experience" ADD CONSTRAINT "candidate_discipline_experience_discipline_id_disciplines_id_fk" FOREIGN KEY ("discipline_id") REFERENCES "public"."disciplines"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "client_staff_locations" ADD CONSTRAINT "client_staff_locations_primary_location_id_company_office_locations_id_fk" FOREIGN KEY ("primary_location_id") REFERENCES "public"."company_office_locations"("id") ON DELETE cascade ON UPDATE no action;
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
 ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_client_id_client_profiles_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client_profiles"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_ciscipline_id_disciplines_id_fk" FOREIGN KEY ("ciscipline_id") REFERENCES "public"."disciplines"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "workdays" ADD CONSTRAINT "workdays_timesheet_id_timesheets_id_fk" FOREIGN KEY ("timesheet_id") REFERENCES "public"."timesheets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "skills" ADD CONSTRAINT "skills_category_id_skill_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."skill_categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
