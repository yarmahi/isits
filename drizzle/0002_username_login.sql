ALTER TABLE "user" ADD COLUMN "username" text;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "display_username" text;
--> statement-breakpoint
UPDATE "user" SET
  username = left(
    regexp_replace(lower(split_part(email, '@', 1)), '[^a-zA-Z0-9_.]', '_', 'g')
    || '_' || substring(replace(id::text, '-', ''), 1, 8),
    32
  ),
  display_username = name;
--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_username_unique" UNIQUE("username");
