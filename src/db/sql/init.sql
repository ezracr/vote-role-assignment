CREATE TABLE IF NOT EXISTS channel_settings(
  "id" text PRIMARY KEY COLLATE "C",
  "data" jsonb,
  "created" timestamp WITH TIME ZONE DEFAULT now() NOT NULL
);
