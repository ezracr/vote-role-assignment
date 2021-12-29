CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS "channel_settings"(
  "id" text PRIMARY KEY COLLATE "C",
  "data" jsonb,
  "created" timestamp WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "documents"(
  "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  "author_id" text COLLATE "C",
  "author_tag" text COLLATE "C",
  "link" text,
  "title" text,
  "created" timestamp WITH TIME ZONE DEFAULT now() NOT NULL,
  "ch_sett_id" text COLLATE "C",
  UNIQUE("author_id", "link")
);

ALTER TABLE documents
  ADD CONSTRAINT documents_ch_sett_id_id_fk FOREIGN KEY ("ch_sett_id")
    REFERENCES channel_settings ("id") ON UPDATE RESTRICT ON DELETE CASCADE;
