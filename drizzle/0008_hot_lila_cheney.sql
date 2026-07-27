ALTER TABLE "utility_bills" ADD COLUMN "is_reviewed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "utility_bills" ADD COLUMN "reviewed_by" text;--> statement-breakpoint
ALTER TABLE "utility_bills" ADD COLUMN "reviewed_at" timestamp;