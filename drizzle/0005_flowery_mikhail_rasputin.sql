CREATE TABLE "field_definitions" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"field_type" text NOT NULL,
	"is_custom" boolean DEFAULT true NOT NULL,
	"system_column" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"searchable" boolean DEFAULT false NOT NULL,
	"filterable" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"select_options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "field_definitions_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE INDEX "field_definitions_sort_idx" ON "field_definitions" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "field_definitions_custom_idx" ON "field_definitions" USING btree ("is_custom");