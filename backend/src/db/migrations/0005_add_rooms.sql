CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"building" text NOT NULL,
	"floor" integer,
	"capacity" integer NOT NULL,
	"equipment" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_capacity_positive_check" CHECK ("rooms"."capacity" > 0),
	CONSTRAINT "rooms_building_name_unique" UNIQUE("building","name")
);
--> statement-breakpoint
CREATE INDEX "rooms_is_active_building_idx" ON "rooms" ("is_active","building");
--> statement-breakpoint
CREATE INDEX "rooms_capacity_idx" ON "rooms" ("capacity");
