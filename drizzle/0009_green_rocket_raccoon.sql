CREATE TABLE "bill_activity_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"bill_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
