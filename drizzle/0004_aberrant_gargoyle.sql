CREATE TABLE "activity_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"event_type" text NOT NULL,
	"actor_user_id" text,
	"actor_role" text,
	"entity_type" text,
	"entity_id" text,
	"route" text,
	"url" text,
	"http_method" text,
	"request_id" text,
	"session_id" text,
	"ip_address" text,
	"user_agent" text,
	"browser_name" text,
	"browser_version" text,
	"os_name" text,
	"device_type" text,
	"before_snapshot" jsonb,
	"after_snapshot" jsonb,
	"metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "activity_logs_event_type_idx" ON "activity_logs" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "activity_logs_actor_user_id_idx" ON "activity_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "activity_logs_entity_idx" ON "activity_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "records_date_received_idx" ON "records" USING btree ("date_received");