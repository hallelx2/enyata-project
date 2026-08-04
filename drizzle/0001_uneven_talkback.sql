CREATE TABLE "emr_record" (
	"id" text PRIMARY KEY NOT NULL,
	"hospital_id" text NOT NULL,
	"patient_name" text NOT NULL,
	"patient_email" text,
	"patient_phone" text,
	"date_of_birth" text,
	"blood_type" text,
	"allergies" text,
	"conditions" text,
	"last_visit" text,
	"aura_id" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "escrow_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"hospital_id" text NOT NULL,
	"amount" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"transaction_ref" text NOT NULL,
	"interswitch_ref" text,
	"payment_provider" text DEFAULT 'interswitch' NOT NULL,
	"provider_ref" text,
	"description" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "escrow_transaction_transaction_ref_unique" UNIQUE("transaction_ref")
);
--> statement-breakpoint
CREATE TABLE "hospital_profile" (
	"hospital_id" text PRIMARY KEY NOT NULL,
	"description" text,
	"specialties" text,
	"address" text,
	"emergency_phone" text,
	"bed_count" integer DEFAULT 0,
	"icu_count" integer DEFAULT 0,
	"emergency_services" boolean DEFAULT true,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hospital_resource" (
	"id" text PRIMARY KEY NOT NULL,
	"hospital_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"total_count" integer DEFAULT 0 NOT NULL,
	"available_count" integer DEFAULT 0 NOT NULL,
	"price_naira" integer DEFAULT 0,
	"unit" text DEFAULT 'units',
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_hospital_link" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"hospital_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp NOT NULL,
	"approved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "triage_request" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"hospital_id" text NOT NULL,
	"symptoms" text NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"escrow_ref" text,
	"differentials" text,
	"clinical_summary" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "emr_record" ADD CONSTRAINT "emr_record_hospital_id_user_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_transaction" ADD CONSTRAINT "escrow_transaction_patient_id_user_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_transaction" ADD CONSTRAINT "escrow_transaction_hospital_id_user_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hospital_profile" ADD CONSTRAINT "hospital_profile_hospital_id_user_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hospital_resource" ADD CONSTRAINT "hospital_resource_hospital_id_user_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_hospital_link" ADD CONSTRAINT "patient_hospital_link_patient_id_user_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_hospital_link" ADD CONSTRAINT "patient_hospital_link_hospital_id_user_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "triage_request" ADD CONSTRAINT "triage_request_patient_id_user_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "triage_request" ADD CONSTRAINT "triage_request_hospital_id_user_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;