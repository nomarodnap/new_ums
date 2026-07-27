CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audits" (
	"id" text PRIMARY KEY NOT NULL,
	"utility_bill_id" text NOT NULL,
	"auditor_id" text NOT NULL,
	"is_late_receive" boolean DEFAULT false,
	"is_incomplete_receive_date" boolean DEFAULT false,
	"is_late_payment" boolean DEFAULT false,
	"is_overdue_more_than_2_months" boolean DEFAULT false,
	"is_wrong_month" boolean DEFAULT false,
	"is_phone_over_limit" boolean DEFAULT false,
	"is_wrong_budget" boolean DEFAULT false,
	"is_duplicate" boolean DEFAULT false,
	"status" text DEFAULT 'PENDING_CORRECTION' NOT NULL,
	"remarks" text,
	"attachment_proof" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" text PRIMARY KEY NOT NULL,
	"budget_code" text NOT NULL,
	"name" text NOT NULL,
	"fund_source" text,
	"allocated_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"transferred_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"department_id" text NOT NULL,
	"fiscal_year" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" text PRIMARY KEY NOT NULL,
	"cost_center_code" text,
	"disbursing_unit" text,
	"deposit_unit" text,
	"full_name" text NOT NULL,
	"short_name" text,
	"division" text,
	"location" text,
	"province" text,
	"responsible_person" text,
	"phone" text,
	"responsible_phone" text,
	"email" text,
	"type" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"role" text,
	"banned" boolean,
	"ban_reason" text,
	"ban_expires" timestamp,
	"department_id" text,
	"phone" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "utility_bills" (
	"id" text PRIMARY KEY NOT NULL,
	"department_id" text NOT NULL,
	"utility_type" text NOT NULL,
	"billing_month" integer NOT NULL,
	"billing_year" integer NOT NULL,
	"provider" text,
	"service_number" text,
	"invoice_number" text,
	"invoice_date" timestamp,
	"location_type" text,
	"usage_amount" numeric(10, 2),
	"invoice_amount" numeric(15, 2),
	"estimated_amount" numeric(15, 2),
	"received_date" timestamp,
	"sent_to_disbursing_date" timestamp,
	"disbursing_received_date" timestamp,
	"payment_date" timestamp,
	"payment_doc_number" text,
	"doc_type" text,
	"account_code" text,
	"budget_code" text,
	"fund_source" text,
	"paid_amount" numeric(15, 2),
	"payment_status" text DEFAULT 'PENDING' NOT NULL,
	"invoice_status" text DEFAULT 'RECEIVED' NOT NULL,
	"receipt_number" text,
	"receipt_date" timestamp,
	"receipt_payment_date" timestamp,
	"attachment_invoice" text,
	"attachment_receipt" text,
	"attachment_payment_doc" text,
	"is_pending_bill_only" boolean DEFAULT false NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;