CREATE TABLE "department_services" (
	"id" text PRIMARY KEY NOT NULL,
	"department_id" text NOT NULL,
	"utility_type" text NOT NULL,
	"provider" text NOT NULL,
	"service_number" text NOT NULL,
	"location_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
