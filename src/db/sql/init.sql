CREATE TABLE IF NOT EXISTS settings(
  "id" text PRIMARY KEY COLLATE "C",
  "data" jsonb,
  "created" timestamp WITH TIME ZONE DEFAULT now() NOT NULL
);
