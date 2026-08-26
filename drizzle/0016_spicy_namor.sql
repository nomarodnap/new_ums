ALTER TABLE "audits" ADD COLUMN "is_disbursement_over_2_months" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "audits" ADD COLUMN "is_anomaly_expense" boolean DEFAULT false;