CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"department_id" text,
	"target_role" text,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"severity" text DEFAULT 'NORMAL' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
