CREATE TYPE "public"."job_status" AS ENUM('Active', 'Archived', 'Draft');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('SuperAdmin', 'TenantAdmin', 'RecruitmentLead', 'HiringManager', 'Recruiter');--> statement-breakpoint
CREATE TYPE "public"."work_mode" AS ENUM('Remote', 'Hybrid', 'On-Site');--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"current_role" text,
	"location" text,
	"experience" text,
	"status" text DEFAULT 'processing' NOT NULL,
	"score" integer,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"ai_head" text,
	"ai_reasoning" jsonb DEFAULT '[]'::jsonb,
	"capabilities" jsonb DEFAULT '[]'::jsonb,
	"gaps" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_by" uuid,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"location" text DEFAULT 'Remote' NOT NULL,
	"work_mode" "work_mode" DEFAULT 'Remote' NOT NULL,
	"experience" text,
	"status" "job_status" DEFAULT 'Active' NOT NULL,
	"scored" integer DEFAULT 0 NOT NULL,
	"processing" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "jobs_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "rubric_competencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"name" text NOT NULL,
	"level" text DEFAULT 'IMPORTANT' NOT NULL,
	"weight" real DEFAULT 20 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company" text NOT NULL,
	"region" text NOT NULL,
	"active_roles" integer DEFAULT 0 NOT NULL,
	"total_users" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'Active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" "user_role" DEFAULT 'Recruiter' NOT NULL,
	"password_hash" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"lifetime_credits" integer DEFAULT 0 NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rubric_competencies" ADD CONSTRAINT "rubric_competencies_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;