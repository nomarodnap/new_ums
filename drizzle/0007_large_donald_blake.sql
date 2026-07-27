ALTER TABLE "audits" ADD COLUMN "is_manual_anomaly" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "audits" ADD COLUMN "manual_anomaly_reason" text;